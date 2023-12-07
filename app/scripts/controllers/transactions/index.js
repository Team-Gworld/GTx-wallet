import EventEmitter from 'safe-event-emitter';
import ethUtil, { addHexPrefix } from 'ethereumjs-util';
import Bytes from 'eth-lib/lib/bytes';
import Common from '@ethereumjs/common';
import { ObservableStore } from '@metamask/obs-store';
import EthQuery from 'ethjs-query';
import erc20Abi from 'human-standard-token-abi';
import erc721Abi from 'human-standard-collectible-abi';
import abiDecoder from 'abi-decoder';
import { ethErrors } from 'eth-rpc-errors';
import NonceTracker from 'nonce-tracker';
import log from 'loglevel';
import { BN } from 'bn.js';
import BigNumber from 'bignumber.js';
import * as thetajs from '@thetalabs/theta-js';
import request from 'request';
import { baseFeeMultiplier } from '../gas/gasPricingTracker';
import { decGWEIToHexWEI } from '../../../../ui/helpers/utils/conversions.util';
import cleanErrorStack from '../../lib/cleanErrorStack';
import { hexToBn, bnToHex, BnMultiplyByFraction } from '../../lib/util';
import { TRANSACTION_NO_CONTRACT_ERROR_KEY } from '../../../../ui/helpers/constants/error-keys';
import {
  THETAMAINNET_CHAIN_ID_STR,
  THETAMAINNET_NETWORK_ID,
  THETA_GASPRICE_HEXWEI,
  THETA_GAS_PER_TRANSFER_HEXWEI,
  THETAMAINNET_NATIVE_RPC_URL,
  THETAMAINNET_CHAIN_ID,
} from '../network/enums';
import * as theta from '../../../../shared/constants/theta';
import thetaTokens from '../../../../gtx/theta-tokens.json';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../../../../shared/constants/transaction';
import TransactionStateManager from './tx-state-manager';
import TxGasUtil from './tx-gas-utils';
import PendingTransactionTracker from './pending-tx-tracker';
import * as txUtils from './lib/util';
import {
  Transaction,
  FeeMarketEIP1559Transaction,
} from './lib/ethereumjs-tx-mod';

const ThetaTxType = thetajs.constants.TxType;

abiDecoder.addABI(erc20Abi);
abiDecoder.addABI(erc721Abi);

const SIMPLE_GAS_COST = '0x5208'; // Hex for 21000, cost of a simple send.
const MAX_MEMSTORE_TX_LIST_SIZE = 100; // Number of transactions (by unique nonces) to keep in memory

/**
  Transaction Controller is an aggregate of sub-controllers and trackers
  composing them in a way to be exposed to the metamask controller
    <br>- txStateManager
      responsible for the state of a transaction and
      storing the transaction
    <br>- pendingTxTracker
      watching blocks for transactions to be include
      and emitting confirmed events
    <br>- txGasUtil
      gas calculations and safety buffering
    <br>- nonceTracker
      calculating nonces

  @class
  @param {Object} - opts
  @param {Object}  opts.initState - initial transaction list default is an empty array
  @param {Object}  opts.networkStore - an observable store for network number
  @param {Object}  opts.blockTracker - An instance of eth-blocktracker
  @param {Object}  opts.provider - A network provider.
  @param {Function}  opts.signTransaction - function the signs an ethereumjs-tx
  @param {Object}  opts.getPermittedAccounts - get accounts that an origin has permissions for
  @param {Function}  opts.signTransaction - ethTx signer that returns a rawTx
  @param {number}  [opts.txHistoryLimit] - number *optional* for limiting how many transactions are in state
  @param {Object}  opts.preferencesStore
*/

export default class TransactionController extends EventEmitter {
  constructor(opts) {
    super();
    this.networkStore = opts.networkStore || new ObservableStore({});
    this.preferencesStore = opts.preferencesStore || new ObservableStore({});
    this.gasPricingTracker = opts.gasPricingTracker;
    this.provider = opts.provider;
    this._getCurrentChainId = opts.getCurrentChainId;
    this._getSelectedNative = opts.getSelectedNative;
    this._switchToScMode = opts.switchToScMode;
    this.getPermittedAccounts = opts.getPermittedAccounts;
    this.blockTracker = opts.blockTracker;
    this.signEthTx = opts.signTransaction;
    this.inProcessOfSigning = new Set();

    this.memStore = new ObservableStore({});
    this.query = new EthQuery(this.provider);
    this.txGasUtil = new TxGasUtil(this.provider);

    this._mapMethods();
    this.txStateManager = new TransactionStateManager({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetwork: this.getNetwork.bind(this),
      getCurrentChainId: opts.getCurrentChainId,
      getSelectedNative: opts.getSelectedNative,
    });
    this._onBootCleanUp();

    this.store = this.txStateManager.store;
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getPendingTransactions: this.txStateManager.getPendingTransactions.bind(
        this.txStateManager,
      ),
      getConfirmedTransactions:
        this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    });

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: () => {
        const pending = this.txStateManager.getPendingTransactions();
        const approved = this.txStateManager.getApprovedTransactions();
        return [...pending, ...approved];
      },
      approveTransaction: this.approveTransaction.bind(this),
      getCompletedTransactions:
        this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    });

    this.txStateManager.store.subscribe(() => this.emit('update:badge'));
    this._setupListeners();
    // memstore is computed from a few different stores
    this._updateMemstore();
    this.txStateManager.store.subscribe(() => this._updateMemstore());
    this.networkStore.subscribe(() => {
      this._onBootCleanUp();
      this._updateMemstore();
    });

    // request state update to finalize initialization
    this._updatePendingTxsAfterFirstBlock();
  }

  /**
   * Gets the current chainId in the network store as a number, returning 0 if
   * the chainId parses to NaN.
   *
   * @returns {number} The numerical chainId.
   */
  getChainId() {
    const networkState = this.networkStore.getState();
    const chainId = this._getCurrentChainId();
    const integerChainId = parseInt(chainId, 16);
    if (isNaN(networkState) || Number.isNaN(integerChainId)) {
      return 0;
    }
    return integerChainId;
  }

  /**
  Adds a tx to the txlist
  @emits ${txMeta.id}:unapproved
  */
  addTx(txMeta) {
    this.txStateManager.addTx(txMeta);
    this.emit(`${txMeta.id}:unapproved`, txMeta);
  }

  /**
  Wipes the transactions for a given account
  @param {string} address - hex string of the from address for txs being removed
  */
  wipeTransactions(address) {
    this.txStateManager.wipeTransactions(address);
  }

  /**
   * Add a new unapproved transaction to the pipeline
   *
   * @returns {Promise<string>} - the hash of the transaction after being submitted to the network
   * @param {Object} txParams - txParams for the transaction
   * @param {Object} opts - with the key origin to put the origin on the txMeta
   */
  async newUnapprovedTransaction(txParams, opts = {}) {
    log.debug(
      `MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`,
    );

    const initialTxMeta = await this.addUnapprovedTransaction(
      txParams,
      opts.origin,
    );

    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.txStateManager.once(
        `${initialTxMeta.id}:finished`,
        (finishedTxMeta) => {
          switch (finishedTxMeta.status) {
            case 'submitted':
              return resolve(finishedTxMeta.hash);
            case 'rejected':
              return reject(
                cleanErrorStack(
                  ethErrors.provider.userRejectedRequest(
                    'MetaMask Tx Signature: User denied transaction signature.',
                  ),
                ),
              );
            case 'failed':
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(finishedTxMeta.err.message),
                ),
              );
            default:
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(
                    `MetaMask Tx Signature: Unknown problem: ${JSON.stringify(
                      finishedTxMeta.txParams,
                    )}`,
                  ),
                ),
              );
          }
        },
      );
    });
  }

  /**
   * Validates and generates a txMeta with defaults and puts it in txStateManager
   * store.
   *
   * @returns {txMeta}
   */
  async addUnapprovedTransaction(txParams, origin) {
    // validate
    const normalizedTxParams = txUtils.normalizeTxParams(txParams);

    txUtils.validateTxParams(normalizedTxParams);

    /**
    `generateTxMeta` adds the default txMeta properties to the passed object.
    These include the tx's `id`. As we use the id for determining order of
    txes in the tx-state-manager, it is necessary to call the asynchronous
    method `this._determineTransactionType` after `generateTxMeta`.
    */
    let txMeta = this.txStateManager.generateTxMeta({
      txParams: normalizedTxParams,
      type: TRANSACTION_TYPE.SENT_ETHER,
    });

    if (origin === 'metamask') {
      // Assert the from address is the selected address
      if (normalizedTxParams.from !== this.getSelectedAddress()) {
        throw ethErrors.rpc.internal({
          message: `Internally initiated transaction is using invalid account.`,
          data: {
            origin,
            fromAddress: normalizedTxParams.from,
            selectedAddress: this.getSelectedAddress(),
          },
        });
      }
    } else {
      // Assert that the origin has permissions to initiate transactions from
      // the specified address
      const permittedAddresses = await this.getPermittedAccounts(origin);
      if (!permittedAddresses.includes(normalizedTxParams.from)) {
        throw ethErrors.provider.unauthorized({ data: { origin } });
      }

      // if dApp initiated TX but wallet is set to Theta Native then switch to Theta SC mode
      if (
        typeof origin === 'string' &&
        txMeta.metamaskNetworkId === THETAMAINNET_NETWORK_ID &&
        this._getSelectedNative()
      ) {
        if (txMeta.txParams.isThetaNative) {
          delete txMeta.txParams.isThetaNative;
        }
        console.log(
          'changing to smart contract (SC) mode for dApp Tx processing',
        );
        this._switchToScMode();
      }
    }

    txMeta.origin = origin;

    const { type, getCodeResponse } = await this._determineTransactionType(
      txParams,
      txMeta.metamaskNetworkId,
    );
    txMeta.type = type;

    // ensure value
    txMeta.txParams.value = txMeta.txParams.value
      ? ethUtil.addHexPrefix(txMeta.txParams.value)
      : '0x0';

    this.addTx(txMeta);
    this.emit('newUnapprovedTx', txMeta);

    try {
      txMeta = await this.addTxGasDefaults(txMeta, getCodeResponse);
    } catch (error) {
      log.warn(error);
      txMeta = this.txStateManager.getTx(
        txMeta.id,
        txMeta.metamaskNetworkId,
        txMeta.txParams?.isThetaNative,
      );
      if (txMeta) {
        txMeta.loadingDefaults = false;
        this.txStateManager.updateTx(
          txMeta,
          'Failed to calculate gas defaults.',
        );
      }
      throw error;
    }

    txMeta.loadingDefaults = false;
    // save txMeta
    this.txStateManager.updateTx(txMeta, 'Added new unapproved transaction.');

    return txMeta;
  }

  /**
   * Adds the tx gas defaults: gas && gasPrice/maxFeePerGas&maxPriorityFeePerGas
   * @param {Object} txMeta - the txMeta object
   * @returns {Promise<object>} - resolves with txMeta
   */
  async addTxGasDefaults(txMeta, getCodeResponse) {
    // gas limit
    const { gasLimit: defaultGasLimit, simulationFails } = await this._getDefaultGasLimit(txMeta, getCodeResponse);
    if (defaultGasLimit && txMeta.txParams && !txMeta.txParams.gas) {
      txMeta.txParams.gas = defaultGasLimit;
    }

    const { id, metamaskNetworkId, txParams: { isThetaNative } = {} } = txMeta;
    txMeta = this.txStateManager.getTx(id, metamaskNetworkId, isThetaNative); // eslint-disable-line no-param-reassign
    if (!txMeta) {
      throw new Error(
        `Failed to find tx with id ${id} in addTxGasDefaults. Network may still be loading after recent switch.`,
      );
    }

    if (defaultGasLimit && txMeta.txParams && !txMeta.txParams.gas) {
      txMeta.txParams.gas = defaultGasLimit;
    }
    if (simulationFails) {
      txMeta.simulationFails = simulationFails;
    }

    // gas pricing

    if (txMeta.txParams?.isThetaNative) {
      const { txParams } = txMeta;
      txParams.gasPrice = THETA_GASPRICE_HEXWEI;
      if (
        txMeta.type === TRANSACTION_TYPE.SENT_ETHER ||
        ((txMeta.type === TRANSACTION_TYPE.STAKE ||
          txMeta.type === TRANSACTION_TYPE.UNSTAKE) &&
          (txParams.thetaTxType === ThetaTxType.DepositStake ||
            txParams.thetaTxType === ThetaTxType.DepositStakeV2 ||
            txParams.thetaTxType === ThetaTxType.WithdrawStake))
      ) {
        txParams.gas = THETA_GAS_PER_TRANSFER_HEXWEI;
        return txMeta;
      }
    }
    if (
      txMeta.metamaskNetworkId === THETAMAINNET_NETWORK_ID &&
      txMeta.txParams
    ) {
      txMeta.txParams.gasPrice = THETA_GASPRICE_HEXWEI;
    }

    const eip1559Compatible =
      this.gasPricingTracker.getCurrentNetworkEip1559Compatible();
    const defaults = await this._getDefaultGasPriceParams(
      txMeta,
      eip1559Compatible,
    );
    if (eip1559Compatible) {
      if (txMeta.origin === 'metamask' && txMeta.txParams?.gasPrice) {
        // user set fixed gasPrice in legacy mode, so use gasPrice directly
        delete txMeta.txParams?.maxFeePerGas;
        delete txMeta.txParams?.maxPriorityFeePerGas;
      } else {
        if (
          txMeta.origin !== 'metamask' &&
          txMeta.txParams?.gasPrice &&
          !txMeta.txParams?.maxFeePerGas &&
          !txMeta.txParams?.maxPriorityFeePerGas
        ) {
          // dApp suggested fixed gasPrice so use it in eip1559 mode
          if (txMeta.txParams) {
            txMeta.txParams.maxFeePerGas = txMeta.txParams?.gasPrice;
            txMeta.txParams.maxPriorityFeePerGas = txMeta.txParams?.gasPrice;
          }
        } else {
          if (
            txMeta.txParams &&
            !txMeta.txParams.maxFeePerGas &&
            defaults?.maxFeePerGas
          ) {
            txMeta.txParams.maxFeePerGas = defaults?.maxFeePerGas;
          }
          if (
            txMeta.txParams &&
            !txMeta.txParams?.maxPriorityFeePerGas &&
            defaults?.maxPriorityFeePerGas
          ) {
            txMeta.txParams.maxPriorityFeePerGas =
              defaults?.maxPriorityFeePerGas;
          }
        }
        delete txMeta.txParams?.gasPrice;
      }
    } else {
      delete txMeta.txParams?.maxFeePerGas;
      delete txMeta.txParams?.maxPriorityFeePerGas;
    }
    //
    if (
      defaults?.gasPrice &&
      txMeta.txParams &&
      !txMeta.txParams?.gasPrice &&
      !txMeta.txParams?.maxFeePerGas &&
      !txMeta.txParams?.maxPriorityFeePerGas
    ) {
      txMeta.txParams.gasPrice = defaults.gasPrice; // default to legacy gas pricing if no gas price of any type is set
    }

    return txMeta;
  }

  /**
   * Gets default gas price params, or returns `undefined` if is already set
   * @param {Object} txMeta - The txMeta object
   * @returns {Promise<string|undefined>} The default gas price
   */
  async _getDefaultGasPriceParams(txMeta) {
    if (
      (txMeta.txParams.gasPrice && txMeta.txParams.gasPrice !== '0x0') ||
      (txMeta.txParams.maxFeePerGas &&
        txMeta.txParams.maxPriorityFeePerGas &&
        txMeta.txParams.maxFeePerGas !== '0x0' &&
        txMeta.txParams.maxPriorityFeePerGas !== '0x0')
    ) {
      return undefined;
    }
    if (txMeta.metamaskNetworkId === THETAMAINNET_NETWORK_ID) {
      return { gasPrice: THETA_GASPRICE_HEXWEI };
    }

    const estimates = this.gasPricingTracker.getBasicGasEstimates(
      txMeta.metamaskNetworkId,
    );
    if (estimates.average) {
      if (estimates.baseFee) {
        return {
          maxFeePerGas: ethUtil.addHexPrefix(
            decGWEIToHexWEI(
              estimates.baseFee * baseFeeMultiplier + estimates.average,
            ),
          ),
          maxPriorityFeePerGas: ethUtil.addHexPrefix(
            decGWEIToHexWEI(estimates.average),
          ),
        };
      }
      return {
        gasPrice: ethUtil.addHexPrefix(decGWEIToHexWEI(estimates.average)),
      };
    }

    const gasPrice = await this.query.gasPrice();
    return {
      gasPrice: ethUtil.addHexPrefix(gasPrice.toString(16)),
    };
  }

  /**
   * Gets default gas limit, or debug information about why gas estimate failed.
   * @param {Object} txMeta - The txMeta object
   * @param {string} getCodeResponse - The transaction category code response, used for debugging purposes
   * @returns {Promise<Object>} Object containing the default gas limit, or the simulation failure object
   */
  async _getDefaultGasLimit(txMeta, getCodeResponse) {
    if (txMeta.txParams?.gas) {
      return {};
    } else if (
      txMeta.txParams.to &&
      txMeta.type === TRANSACTION_TYPE.SENT_ETHER
    ) {
      // if there's data in the params, but there's no contract code, it's not a valid transaction
      if (txMeta.txParams.data) {
        const err = new Error(
          'TxGasUtil - Trying to call a function on a non-contract address',
        );
        // set error key so ui can display localized error message
        err.errorKey = TRANSACTION_NO_CONTRACT_ERROR_KEY;

        // set the response on the error so that we can see in logs what the actual response was
        err.getCodeResponse = getCodeResponse;
        throw err;
      }

      // This is a standard ether simple send, gas requirement is exactly 21k
      return { gasLimit: SIMPLE_GAS_COST };
    }

    const { blockGasLimit, estimatedGasHex, simulationFails } =
      await this.txGasUtil.analyzeGasUsage(txMeta);

    // add additional gas buffer to our estimation for safety
    const gasLimit = this.txGasUtil.addGasBuffer(
      estimatedGasHex,
      blockGasLimit,
    );
    return { gasLimit, simulationFails };
  }

  /**
   * Creates a new approved transaction to attempt to cancel a previously submitted transaction. The
   * new transaction contains the same nonce as the previous, is a basic ETH transfer of 0x value to
   * the sender's address, and has a higher gasPrice than that of the previous transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {string} [customGasPriceParams]
   * @returns {txMeta}
   */
  async createCancelTransaction(originalTxId, customGasPriceParams) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId);
    const { txParams } = originalTxMeta;
    const {
      gasPrice: lastGasPrice,
      maxFeePerGas: lastMaxFeePerGas,
      maxPriorityFeePerGas: lastMaxPriorityFeePerGas,
      from,
      nonce,
    } = txParams;

    let lastGasPriceParams;
    if (lastGasPrice) {
      lastGasPriceParams = { gasPrice: lastGasPrice };
    } else {
      lastGasPriceParams = {
        maxFeePerGas: lastMaxFeePerGas,
        maxPriorityFeePerGas: lastMaxPriorityFeePerGas,
      };
    }

    let newGasPriceParams;
    if (
      customGasPriceParams?.gasPrice ||
      (lastGasPrice && !customGasPriceParams?.maxPriorityFeePerGas)
    ) {
      newGasPriceParams = {
        gasPrice:
          customGasPriceParams?.gasPrice ||
          bnToHex(BnMultiplyByFraction(hexToBn(lastGasPrice), 11, 10)),
      };
    } else {
      let maxPriorityFeePerGas = customGasPriceParams?.maxPriorityFeePerGas;
      if (!maxPriorityFeePerGas) {
        const bnLast = hexToBn(lastMaxFeePerGas);
        let tmp = BnMultiplyByFraction(bnLast, 11, 10);
        if (!tmp.gte(bnLast.add(new BN(1)))) {
          tmp = bnLast.add(new BN(1));
        }
        maxPriorityFeePerGas = bnToHex(tmp);
      }
      newGasPriceParams = {
        maxFeePerGas:
          customGasPriceParams?.maxFeePerGas ||
          bnToHex(BnMultiplyByFraction(hexToBn(lastMaxFeePerGas), 11, 10)),
        maxPriorityFeePerGas,
      };
    }

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        from,
        to: from,
        nonce,
        gas: '0x5208',
        value: '0x0',
        ...newGasPriceParams,
      },
      lastGasPriceParams,
      loadingDefaults: false,
      status: TRANSACTION_STATUS.APPROVED,
      type: TRANSACTION_TYPE.CANCEL,
    });

    this.addTx(newTxMeta);
    await this.approveTransaction(newTxMeta.id);
    return newTxMeta;
  }

  /**
   * Creates a new approved transaction to attempt to speed up a previously submitted transaction. The
   * new transaction contains the same nonce as the previous. By default, the new transaction will use
   * the same gas limit and a 10% higher gas price, though it is possible to set a custom value for
   * each instead.
   * @param {number} originalTxId - the id of the txMeta that you want to speed up
   * @param {string} [customGasPriceParams]
   * @param {string} [customGasLimit] - The new custom gas limt, in hex
   * @returns {txMeta}
   */
  async createSpeedUpTransaction(
    originalTxId,
    customGasPriceParams,
    customGasLimit,
  ) {
    const originalTxMeta = this.txStateManager.getTx(originalTxId);
    const { txParams } = originalTxMeta;
    const {
      gasPrice: lastGasPrice,
      maxFeePerGas: lastMaxFeePerGas,
      maxPriorityFeePerGas: lastMaxPriorityFeePerGas,
    } = txParams;

    let lastGasPriceParams;
    if (lastGasPrice) {
      lastGasPriceParams = { gasPrice: lastGasPrice };
    } else {
      lastGasPriceParams = {
        maxFeePerGas: lastMaxFeePerGas,
        maxPriorityFeePerGas: lastMaxPriorityFeePerGas,
      };
    }

    let newGasPriceParams;
    if (
      customGasPriceParams?.gasPrice ||
      (lastGasPrice && !customGasPriceParams?.maxPriorityFeePerGas)
    ) {
      newGasPriceParams = {
        gasPrice:
          customGasPriceParams?.gasPrice ||
          bnToHex(BnMultiplyByFraction(hexToBn(lastGasPrice), 11, 10)),
      };
    } else {
      let maxPriorityFeePerGas = customGasPriceParams?.maxPriorityFeePerGas;
      if (!maxPriorityFeePerGas) {
        const bnLast = hexToBn(lastMaxFeePerGas);
        let tmp = BnMultiplyByFraction(bnLast, 11, 10);
        if (!tmp.gte(bnLast.add(new BN(1)))) {
          tmp = bnLast.add(new BN(1));
        }
        maxPriorityFeePerGas = bnToHex(tmp);
      }
      newGasPriceParams = {
        maxFeePerGas:
          customGasPriceParams?.maxFeePerGas ||
          bnToHex(BnMultiplyByFraction(hexToBn(lastMaxFeePerGas), 11, 10)),
        maxPriorityFeePerGas,
      };
    }

    let newTxParams = {
      ...txParams,
    };
    delete newTxParams.gasPrice;
    delete newTxParams.maxFeePerGas;
    delete newTxParams.maxPriorityFeePerGas;
    newTxParams = {
      ...newTxParams,
      ...newGasPriceParams,
    };

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: newTxParams,
      lastGasPriceParams,
      loadingDefaults: false,
      status: TRANSACTION_STATUS.APPROVED,
      type: TRANSACTION_TYPE.RETRY,
    });

    if (customGasLimit) {
      newTxMeta.txParams.gas = customGasLimit;
    }

    this.addTx(newTxMeta);
    await this.approveTransaction(newTxMeta.id);
    return newTxMeta;
  }

  /**
  updates the txMeta in the txStateManager
  @param {Object} txMeta - the updated txMeta
  */
  async updateTransaction(txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user updated transaction');
  }

  /**
  updates and approves the transaction
  @param {Object} txMeta
  */
  async updateAndApproveTransaction(txMeta) {
    this.txStateManager.updateTx(txMeta, 'confTx: user approved transaction');
    await this.approveTransaction(txMeta.id);
  }

  /**
  sets the tx status to approved
  auto fills the nonce
  signs the transaction
  publishes the transaction
  if any of these steps fails the tx status will be set to failed
    @param {number} txId - the tx's Id
  */
  async approveTransaction(txId) {
    // TODO: Move this safety out of this function.
    // Since this transaction is async,
    // we need to keep track of what is currently being signed,
    // So that we do not increment nonce + resubmit something
    // that is already being incremented & signed.

    if (this.inProcessOfSigning.has(txId)) {
      return;
    }
    this.inProcessOfSigning.add(txId);
    let nonceLock;
    try {
      // approve
      this.txStateManager.setTxStatusApproved(txId);
      // get next nonce
      const txMeta = this.txStateManager.getTx(txId);
      const fromAddress = txMeta.txParams.from;
      // wait for a nonce
      let { customNonceValue } = txMeta;
      customNonceValue = Number(customNonceValue);
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress);
      // add nonce to txParams
      // if txMeta has lastGasPriceParams then it is a retry at same nonce with higher
      // gas price transaction and their for the nonce should not be calculated
      const nonce = txMeta.lastGasPriceParams
        ? txMeta.txParams.nonce
        : nonceLock.nextNonce;
      const customOrNonce =
        customNonceValue === 0 ? customNonceValue : customNonceValue || nonce;

      txMeta.txParams.nonce = ethUtil.addHexPrefix(customOrNonce.toString(16));
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails;
      if (customNonceValue) {
        txMeta.nonceDetails.customNonceValue = customNonceValue;
      }
      this.txStateManager.updateTx(txMeta, 'transactions#approveTransaction');

      // sign and publish transaction
      if (
        txMeta.metamaskNetworkId === THETAMAINNET_NETWORK_ID &&
        txMeta.txParams.isThetaNative
      ) {
        const rawTx = await this.signThetaTransaction(txId);
        await this.publishThetaTransaction(txId, rawTx);
      } else {
        const rawTx = await this.signTransaction(txId);
        await this.publishTransaction(txId, rawTx);
      }

      // must set transaction to submitted/failed before releasing lock
      nonceLock.releaseLock();
    } catch (err) {
      // this is try-catch wrapped so that we can guarantee that the nonceLock is released
      try {
        this.txStateManager.setTxStatusFailed(txId, err);
      } catch (err2) {
        log.error(err2);
      }
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) {
        nonceLock.releaseLock();
      }
      // continue with error chain
      throw err;
    } finally {
      this.inProcessOfSigning.delete(txId);
    }
  }

  /**
    adds the chain id and signs the transaction and set the status to signed
    @param {number} txId - the tx's Id
    @returns {string} - rawTx
  */
  async signTransaction(txId) {
    const txMeta = this.txStateManager.getTx(txId);
    // add network/chain id
    const chainId = this.getChainId(); // integer
    if (txMeta.txParams?.chainId){
      const txChainId = typeof txMeta.txParams.chainId === 'number' ? txMeta.txParams.chainId : parseInt(txMeta.txParams.chainId) // eslint-disable-line radix
      if (txChainId !== chainId){
        throw new Error('ChainID in txParams does not match current network');
      }
    }
    const txParams = { ...txMeta.txParams, chainId };
    // sign tx
    const useTxParams = { gasLimit: txParams.gas, ...txParams };
    const fromAddress = useTxParams.from;
    let ethTx;
    if (useTxParams.maxFeePerGas) {
      const common = Common.isSupportedChainId(chainId)
        ? new Common({ chain: chainId, hardfork: 'london' })
        : Common.custom({ chainId }, { baseChain: 1, hardfork: 'london' });
      const unsignedEthTx = new FeeMarketEIP1559Transaction(useTxParams, {
        common,
      });
      const returnedSignedTx = await this.signEthTx(unsignedEthTx, fromAddress);
      ethTx = returnedSignedTx || unsignedEthTx.etc.signedTx;
    } else {
      const common = Common.isSupportedChainId(chainId)
        ? new Common({ chain: chainId, hardfork: 'berlin' })
        : Common.custom({ chainId }, { baseChain: 1, hardfork: 'berlin' });
      const unsignedEthTx = new Transaction(useTxParams, { common });
      const returnedSignedTx = await this.signEthTx(unsignedEthTx, fromAddress);
      ethTx = returnedSignedTx || unsignedEthTx.etc.signedTx;
    }

    // add r,s,v values for provider request purposes see createMetamaskMiddleware
    // and JSON rpc standard for further explanation
    txMeta.r = ethUtil.bufferToHex(ethTx.r);
    txMeta.s = ethUtil.bufferToHex(ethTx.s);
    txMeta.v = ethUtil.bufferToHex(ethTx.v);

    this.txStateManager.updateTx(
      txMeta,
      'transactions#signTransaction: add r, s, v values',
    );

    // set state to signed
    this.txStateManager.setTxStatusSigned(txMeta.id);
    const rawTx = ethUtil.bufferToHex(ethTx.serialize());
    return rawTx;
  }

  async signThetaTransaction(txId) {
    const txMeta = this.txStateManager.getTx(txId);

    // add additional data to txParams
    const chainId = addHexPrefix(parseInt(this.getChainId()).toString(16)); // eslint-disable-line radix
    if (txMeta.txParams?.chainId){
      const txChainId = addHexPrefix(parseInt(txMeta.txParams.chainId).toString(16)); // eslint-disable-line radix
      if (txChainId !== chainId){
        throw new Error('ChainID in txParams does not match current network');
      }
    }
    const txParams = {
      ...txMeta.txParams,
      chainId,
      gasLimit: txMeta.txParams.gas,
    };

    // get tx in native theta format
    let thetaTx;
    const sequence = parseInt(txParams.nonce, 16) + 1; // theta nonce is one higher than MM expects (eth starts at 0, theta starts at 1) and theta TX expects int not hex
    switch (txParams.thetaTxType) {
      case ThetaTxType.Send: {
        const thetaTxData = {
          from: txParams.from,
          outputs: [
            {
              address: txParams.to,
              tfuelWei: new BigNumber(txParams.value),
              thetaWei: new BigNumber(txParams.value2 || '0x0'),
            },
          ],
          sequence,
        };
        thetaTx = new thetajs.transactions.SendTransaction(thetaTxData);
        break;
      }
      case ThetaTxType.SmartContract: {
        const thetaTxData = {
          from: txParams.from,
          to: txParams.to,
          value: new BigNumber(txParams.value),
          thetaValue: new BigNumber(txParams.value2 || '0x0'),
          data: txParams.data,
          sequence,
        };
        thetaTx = new thetajs.transactions.SmartContractTransaction(
          thetaTxData,
        );
        break;
      }
      case ThetaTxType.DepositStakeV2: {
        const thetaTxData = {
          source: txParams.from,
          holderSummary: txParams.additional.holderSummary,
          purpose: txParams.additional.purpose,
          amount:
            txParams.additional.purpose ===
              thetajs.constants.StakePurpose.StakeForEliteEdge
              ? txParams.value
              : txParams.value2,
          sequence,
        };
        thetaTx = new thetajs.transactions.DepositStakeV2Transaction(
          thetaTxData,
        );
        break;
      }
      case ThetaTxType.WithdrawStake: {
        const thetaTxData = {
          source: txParams.from,
          holder: txParams.to,
          purpose: txParams.additional.purpose,
          sequence,
        };
        thetaTx = new thetajs.transactions.WithdrawStakeTransaction(
          thetaTxData,
        );
        break;
      }
      case ThetaTxType.DepositStake: {
        const thetaTxData = {
          source: txParams.from,
          holder: txParams.to,
          purpose: txParams.additional.purpose,
          amount:
            txParams.additional.purpose ===
              thetajs.constants.StakePurpose.StakeForEliteEdge
              ? txParams.value
              : txParams.value2,
          sequence,
        };
        thetaTx = new thetajs.transactions.DepositStakeTransaction(thetaTxData);
        break;
      }
      default:
        throw new Error(
          `TransactionController: theta native transaction type "${txMeta.txParams.thetaTxType}" not supported`,
        );
    }

    // sign theta tx wrapped in eth wrapper
    const thetaChainID = THETAMAINNET_CHAIN_ID_STR;
    const encodedChainID = ethUtil.rlp
      .encode(Bytes.fromString(thetaChainID))
      .toString('hex');
    const encodedTxType = ethUtil.rlp
      .encode(Bytes.fromNumber(txParams.thetaTxType))
      .toString('hex');
    const encodedTx = ethUtil.rlp.encode(thetaTx.rlpInput()).toString('hex');
    const payload = `0x${encodedChainID}${encodedTxType}${encodedTx}`;
    const unsignedEthTx = new Transaction(
      {
        nonce: '0x0',
        gasPrice: '0x0',
        gasLimit: '0x0',
        to: '0x0000000000000000000000000000000000000000',
        value: '0x0',
        data: payload,
      },
      { chain: 'mainnet', hardfork: 'byzantium' },
    );
    // const signedEthTx = await this.signEthTx(unsignedEthTx, txParams.from)
    const returnedSignedTx = await this.signEthTx(unsignedEthTx, txParams.from);
    const signedEthTx = returnedSignedTx || unsignedEthTx.etc.signedTx;    

    // add r,s,v values for provider request purposes
    txMeta.r = `0x${ethUtil
      .bufferToHex(signedEthTx.r)
      .slice(2)
      .padStart(64, '0')}`;
    txMeta.s = `0x${ethUtil
      .bufferToHex(signedEthTx.s)
      .slice(2)
      .padStart(64, '0')}`;
    txMeta.v = `0x${(parseInt(signedEthTx.v.toString('hex'), 16) - 37)
      .toString()
      .padStart(2, '0')}`;
    // get signed TX bytes in native theta format
    const signature = txMeta.r + txMeta.s.slice(2) + txMeta.v.slice(2);
    thetaTx.setSignature(signature);
    const signedTxRaw = `0x${thetajs.transactions.serialize(thetaTx)}`;

    // update state
    this.txStateManager.updateTx(
      txMeta,
      'transactions#signTransaction: add r, s, v values',
    );
    this.txStateManager.setTxStatusSigned(txMeta.id);

    return signedTxRaw;
  }

  /**
    publishes the raw tx and sets the txMeta to submitted
    @param {number} txId - the tx's Id
    @param {string} rawTx - the hex string of the serialized signed transaction
    @returns {Promise<void>}
  */
  async publishTransaction(txId, rawTx) {
    const txMeta = this.txStateManager.getTx(txId);
    txMeta.rawTx = rawTx;
    this.txStateManager.updateTx(txMeta, 'transactions#publishTransaction');
    let txHash;
    try {
      txHash = await this.query.sendRawTransaction(rawTx);
    } catch (error) {
      if (error.message.toLowerCase().includes('known transaction')) {
        txHash = ethUtil.sha3(ethUtil.addHexPrefix(rawTx)).toString('hex');
        txHash = ethUtil.addHexPrefix(txHash);
      } else {
        throw error;
      }
    }
    this.setTxHash(txId, txHash);

    this.txStateManager.setTxStatusSubmitted(txId);
  }

  async publishThetaTransaction(txId, rawTx) {
    const txMeta = this.txStateManager.getTx(txId);
    txMeta.rawTx = rawTx;
    this.txStateManager.updateTx(txMeta, 'transactions#publishTransaction');
    let txHash;
    try {
      txHash = await new Promise((resolve, reject) => {
        request(
          {
            // may want to move this requester and parser into transaction utils like isSmartContract and use defaults for most params
            url: THETAMAINNET_NATIVE_RPC_URL,
            method: 'post',
            json: true,
            headers: { 'Content-Type': 'application/json' },
            body: {
              jsonrpc: '2.0',
              method: 'theta.BroadcastRawTransactionAsync',
              params: [
                {
                  tx_bytes: rawTx,
                },
              ],
              id: 1,
            },
          },
          (err, res, body) => {
            if (err) {
              log.error('ERROR broadcasting theta tx: ', JSON.stringify(err));
              reject(err);
              return;
            }
            if (body.error) {
              log.error(
                'ERROR broadcasting theta tx: ',
                JSON.stringify(body.error),
              );
              reject(new Error(body.error?.message));
              return;
            }
            log.debug('thetaRpc.publicTx.Result: ', res);
            if (res.statusCode === 200) {
              // may want to use Theta's CallSmartContract to estimate gas first and that can give the revert error PRIOR to sending
              const obj = body;
              const hash = obj?.result?.hash;
              log.info(`theta tx submitted with txHash ${hash}`);
              resolve(hash);
            } else {
              const error = `Error HTTP ${res.statusCode} when broadcasting transaction to Native Theta RPC`;
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      log.error('Failed to broadcast tx: ', error);
      txMeta.warning = {
        error,
        message: error,
      };
      throw error;
    }

    this.setTxHash(txId, txHash);

    this.txStateManager.setTxStatusSubmitted(txId);
  }

  /**
   * Sets the status of the transaction to confirmed and sets the status of nonce duplicates as
   * dropped if the txParams have data it will fetch the txReceipt
   * @param {number} txId - The tx's ID
   * @returns {Promise<void>}
   */
  async confirmTransaction(txId, txReceipt) {
    // get the txReceipt before marking the transaction confirmed
    // to ensure the receipt is gotten before the ui revives the tx
    const txMeta = this.txStateManager.getTx(txId);

    if (!txMeta) {
      return;
    }

    try {
      // It seems that sometimes the numerical values being returned from
      // this.query.getTransactionReceipt are BN instances and not strings.
      const gasUsed =
        typeof txReceipt.gasUsed === 'string'
          ? txReceipt.gasUsed
          : txReceipt.gasUsed.toString(16);

      txMeta.txReceipt = {
        ...txReceipt,
        gasUsed,
      };

      this.txStateManager.updateTx(
        txMeta,
        'transactions#confirmTransaction - add txReceipt',
      );
    } catch (err) {
      log.error(err);
    }

    this.txStateManager.setTxStatusConfirmed(txId);
    this._markNonceDuplicatesDropped(txId);
  }

  /**
    Convenience method for the ui thats sets the transaction to rejected
    @param {number} txId - the tx's Id
    @returns {Promise<void>}
  */
  async cancelTransaction(txId) {
    this.txStateManager.setTxStatusRejected(txId);
  }

  /**
    Sets the txHas on the txMeta
    @param {number} txId - the tx's Id
    @param {string} txHash - the hash for the txMeta
  */
  setTxHash(txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.txStateManager.getTx(txId);
    txMeta.hash = txHash;
    this.txStateManager.updateTx(txMeta, 'transactions#setTxHash');
  }

  //
  //           PRIVATE METHODS
  //
  /** maps methods for convenience*/
  _mapMethods() {
    /** @returns {Object} - the state in transaction controller */
    this.getState = () => this.memStore.getState();

    /** @returns {string|number} - the network number stored in networkStore */
    this.getNetwork = () => this.networkStore.getState();

    /** @returns {string} - the user selected address */
    this.getSelectedAddress = () =>
      this.preferencesStore.getState().selectedAddress;

    /** @returns {array} - transactions whos status is unapproved */
    this.getUnapprovedTxCount = () =>
      Object.keys(this.txStateManager.getUnapprovedTxList()).length;

    /**
      @returns {number} - number of transactions that have the status submitted
      @param {string} account - hex prefixed account
    */
    this.getPendingTxCount = (account) =>
      this.txStateManager.getPendingTransactions(account).length;

    /** see txStateManager */
    this.getFilteredTxList = (opts) =>
      this.txStateManager.getFilteredTxList(opts);
  }

  // called once on startup
  async _updatePendingTxsAfterFirstBlock() {
    // wait for first block so we know we're ready
    await this.blockTracker.getLatestBlock();
    // get status update for all pending transactions (for the current network)
    await this.pendingTxTracker.updatePendingTxs();
  }

  /**
    If transaction controller was rebooted with transactions that are uncompleted
    in steps of the transaction signing or user confirmation process it will either
    transition txMetas to a failed state or try to redo those tasks.
  */

  _onBootCleanUp() {
    this.txStateManager
      .getFilteredTxList({
        status: 'unapproved',
        loadingDefaults: true,
      })
      .forEach((tx) => {
        this.addTxGasDefaults(tx)
          .then((txMeta) => {
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTx(
              txMeta,
              'transactions: gas estimation for tx on boot',
            );
          })
          .catch((error) => {
            const txMeta = this.txStateManager.getTx(tx.id);
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTx(
              txMeta,
              'failed to estimate gas during boot cleanup.',
            );
            this.txStateManager.setTxStatusFailed(txMeta.id, error);
          });
      });

    this.txStateManager
      .getFilteredTxList({
        status: TRANSACTION_STATUS.APPROVED,
      })
      .forEach((txMeta) => {
        const txSignError = new Error(
          'Transaction found as "approved" during boot - possibly stuck during signing',
        );
        this.txStateManager.setTxStatusFailed(txMeta.id, txSignError);
      });
  }

  /**
    is called in constructor applies the listeners for pendingTxTracker txStateManager
    and blockTracker
  */
  _setupListeners() {
    this.txStateManager.on(
      'tx:status-update',
      this.emit.bind(this, 'tx:status-update'),
    );
    this._setupBlockTrackerListener();
    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTx(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:warning',
      );
    });
    this.pendingTxTracker.on(
      'tx:failed',
      this.txStateManager.setTxStatusFailed.bind(this.txStateManager),
    );
    this.pendingTxTracker.on('tx:confirmed', (txId, transactionReceipt) =>
      this.confirmTransaction(txId, transactionReceipt),
    );
    this.pendingTxTracker.on(
      'tx:dropped',
      this.txStateManager.setTxStatusDropped.bind(this.txStateManager),
    );
    this.pendingTxTracker.on('tx:block-update', (txMeta, latestBlockNumber) => {
      if (!txMeta.firstRetryBlockNumber) {
        txMeta.firstRetryBlockNumber = latestBlockNumber;
        this.txStateManager.updateTx(
          txMeta,
          'transactions/pending-tx-tracker#event: tx:block-update',
        );
      }
    });
    this.pendingTxTracker.on('tx:retry', (txMeta) => {
      if (!('retryCount' in txMeta)) {
        txMeta.retryCount = 0;
      }
      txMeta.retryCount += 1;
      this.txStateManager.updateTx(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:retry',
      );
    });
  }

  _getTransactionName({ data, to }) {
    if (data && Object.keys(theta.contracts).includes(to)) {
      const fourBytes = data.slice(2, 10);
      switch (fourBytes) {
        case theta.fourBytes.deposit:
          return 'wrap';
        case theta.fourBytes.withdraw:
          return 'unwrap';
        default:
      }
    }
    const { name } = (data && abiDecoder.decodeMethod(data)) || {};
    return name;
  }

  /**
    Returns a "type" for a transaction out of the following list: simpleSend, tokenTransfer, tokenApprove,
    contractDeployment, contractMethodCall
  */
  async _determineTransactionType(txParams, networkIdOrChainId) {
    const { data, to, isThetaNative } = txParams;

    if (isThetaNative) {
      const functionSig = data?.slice(0, 10);
      let staking;
      if (to === theta.contracts.WTFUEL || to === theta.contracts.WTHETA) {
        let type;
        switch (functionSig) {
          case theta.fourBytes.deposit:
            type = TRANSACTION_TYPE.TOKEN_METHOD_WRAP;
            break;
          case theta.fourBytes.withdraw:
            type = TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP;
            break;
          default:
        }
        if (type) {
          return { type, getCodeResponse: undefined };
        }
      } else if (
        (staking = Object.values(thetaTokens).filter(
          (t) => to === t.staking?.stakingAddress.toLowerCase(),
        )[0]?.staking)
      ) {
        let type;
        switch (functionSig) {
          case staking.functionSigs.stake:
            type = TRANSACTION_TYPE.STAKE;
            break;
          case staking.functionSigs.unstake:
          case staking.functionSigs.unstakeShares:
            type = TRANSACTION_TYPE.UNSTAKE;
            break;
          default:
        }
        if (type) {
          return { type, getCodeResponse: undefined };
        }
      } else {
        const { thetaTxType } = txParams;
        if (
          thetaTxType === ThetaTxType.DepositStake ||
          thetaTxType === ThetaTxType.DepositStakeV2
        ) {
          return { type: TRANSACTION_TYPE.STAKE, getCodeResponse: undefined };
        } else if (thetaTxType === ThetaTxType.WithdrawStake) {
          return { type: TRANSACTION_TYPE.UNSTAKE, getCodeResponse: undefined };
        }
        if (thetaTxType === ThetaTxType.SmartContract) {
          const stakingToken = Object.values(thetaTokens).filter(
            (t) => t.staking?.stakingAddress === to,
          )[0];
          if (stakingToken) {
            if (functionSig === stakingToken.staking.stake) {
              return {
                type: TRANSACTION_TYPE.STAKE,
                getCodeResponse: undefined,
              };
            } else if (
              functionSig === stakingToken.staking.unstake ||
              functionSig === stakingToken.staking.unstakeShares
            ) {
              return {
                type: TRANSACTION_TYPE.UNSTAKE,
                getCodeResponse: undefined,
              };
            }
          }
        }
      }
    }

    const name = this._getTransactionName({ data, to });
    const tokenMethodName = [
      TRANSACTION_TYPE.TOKEN_METHOD_APPROVE,
      TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER,
      TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM,
      TRANSACTION_TYPE.TOKEN_METHOD_WRAP,
      TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP,
    ]
      .find((methodName) => methodName === name?.toLowerCase())
      ?.toLowerCase();

    let result;
    if (txParams.data && tokenMethodName) {
      result = tokenMethodName;
    } else if (txParams.data && !to) {
      result = TRANSACTION_TYPE.DEPLOY_CONTRACT;
    }

    let code;
    if (!result) {
      try {
        code = (to && (await this.getCode(to, networkIdOrChainId))) || undefined;
      } catch (e) {
        code = null;
        log.warn(e);
      }
      const codeIsEmpty = !code || code === '0x' || code === '0x0';
      result = codeIsEmpty
        ? TRANSACTION_TYPE.SENT_ETHER
        : TRANSACTION_TYPE.CONTRACT_INTERACTION;
      if (codeIsEmpty && !data?.length) code = null;
    }

    return { type: result, getCodeResponse: code };
  }

  async getCode(address, networkIdOrChainId = undefined) {
    let code;
    if (
      networkIdOrChainId === THETAMAINNET_NETWORK_ID ||
      networkIdOrChainId === THETAMAINNET_CHAIN_ID
    ) {
      // getCode is much faster using native theta rpc rather than eth-wrapper rpc
      try {
        code = await new Promise((resolve, reject) => {
          request(
            {
              url: THETAMAINNET_NATIVE_RPC_URL,
              method: 'post',
              json: true,
              headers: { 'Content-Type': 'application/json' },
              body: {
                jsonrpc: '2.0',
                method: 'theta.GetAccount',
                params: [{ address }],
                id: 1,
              },
            },
            (err, res, body) => {
              if (err) {
                console.error(
                  'ERROR checking theta address is contract: ',
                  JSON.stringify(err),
                );
                reject(err);
                return;
              }
              if (body.error) {
                if (
                  body.error?.message?.toLowerCase() ===
                  `account with address ${address.toLowerCase()} is not found`
                ) {
                  resolve('0x');
                  return;
                }
                console.error(
                  'ERROR checking theta address is contract: ',
                  JSON.stringify(body.error),
                );
                reject(new Error(body.error?.message));
                return;
              }
              log.debug('thetaRpc.getCode.result: ', res);
              if (res.statusCode === 200) {
                const obj = body;
                const SHA3_NULL_S =
                  '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
                const gotCode =
                  obj?.result?.code === SHA3_NULL_S ? '0x' : obj?.result?.code;
                resolve(gotCode);
              } else {
                reject(res.statusCode);
              }
            },
          );
        });
        return code;
      } catch (error) {
        log.warn(
          'failed to determine contract code via theta native rpc: ',
          error,
        );
      }
    }
    // if not on theta mainnet or failed to get info from theta rpc, then use evm rpc
    code = (await this.query.getCode(address));
    return code || null;
  }

  /**
    Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
    in the list have the same nonce

    @param {number} txId - the txId of the transaction that has been confirmed in a block
  */
  _markNonceDuplicatesDropped(txId) {
    // get the confirmed transactions nonce and from address
    const txMeta = this.txStateManager.getTx(txId);
    const { nonce, from } = txMeta.txParams;
    const sameNonceTxs = this.txStateManager.getFilteredTxList({ nonce, from });
    if (!sameNonceTxs.length) {
      return;
    }
    // mark all same nonce transactions as dropped and give i a replacedBy hash
    sameNonceTxs.forEach((otherTxMeta) => {
      if (otherTxMeta.id === txId) {
        return;
      }
      otherTxMeta.replacedBy = txMeta.hash;
      this.txStateManager.updateTx(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:confirmed reference to confirmed txHash with same nonce',
      );
      this.txStateManager.setTxStatusDropped(otherTxMeta.id);
    });
  }

  _setupBlockTrackerListener() {
    let listenersAreActive = false;
    const latestBlockHandler = this._onLatestBlock.bind(this);
    const { blockTracker, txStateManager } = this;

    txStateManager.on('tx:status-update', updateSubscription);
    updateSubscription();

    function updateSubscription() {
      const pendingTxs = txStateManager.getPendingTransactions();
      if (!listenersAreActive && pendingTxs.length > 0) {
        blockTracker.on('latest', latestBlockHandler);
        listenersAreActive = true;
      } else if (listenersAreActive && !pendingTxs.length) {
        blockTracker.removeListener('latest', latestBlockHandler);
        listenersAreActive = false;
      }
    }
  }

  async _onLatestBlock(blockNumber) {
    try {
      await this.pendingTxTracker.updatePendingTxs();
    } catch (err) {
      log.error(err);
    }
    try {
      await this.pendingTxTracker.resubmitPendingTxs(blockNumber);
    } catch (err) {
      log.error(err);
    }
  }

  /**
    Updates the memStore in transaction controller
  */
  _updateMemstore() {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList();
    const currentNetworkTxList = this.txStateManager.getTxList(
      MAX_MEMSTORE_TX_LIST_SIZE,
    );
    this.memStore.updateState({ unapprovedTxs, currentNetworkTxList });
  }
}
