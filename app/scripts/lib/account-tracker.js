/* Account Tracker
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

import EthQuery from 'eth-query';

import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import pify from 'pify';
import Web3 from 'web3';
import SINGLE_CALL_BALANCES_ABI from 'single-call-balance-checker-abi';
import { addHexPrefix } from 'ethereumjs-util';
import BN from 'bn.js';
import * as thetajs from '@thetalabs/theta-js';
import request from 'request';
import thetaTokens from '../../../gtx/theta-tokens.json';
import { SINGLE_CALL_BALANCES_ADDRESSES } from '../controllers/network/contract-addresses';
import {
  TFUEL_SYMBOL,
  THETAMAINNET_CHAIN_ID,
  THETAMAINNET_EXPLORER_API_URL,
  THETAMAINNET_NATIVE_RPC_URL,
  THETA_SYMBOL,
} from '../controllers/network/enums';
import { bnToHex } from './util';

export default class AccountTracker {
  /**
   * This module is responsible for tracking any number of accounts and caching their current balances & transaction
   * counts.
   *
   * It also tracks transaction hashes, and checks their inclusion status on each new block.
   *
   * @typedef {Object} AccountTracker
   * @param {Object} opts - Initialize various properties of the class.
   * @property {Object} store The stored object containing all accounts to track, as well as the current block's gas limit.
   * @property {Object} store.accounts The accounts currently stored in this AccountTracker
   * @property {string} store.currentBlockGasLimit A hex string indicating the gas limit of the current block
   * @property {Object} _provider A provider needed to create the EthQuery instance used within this AccountTracker.
   * @property {EthQuery} _query An EthQuery instance used to access account information from the blockchain
   * @property {BlockTracker} _blockTracker A BlockTracker instance. Needed to ensure that accounts and their info updates
   * when a new block is created.
   * @property {Object} _currentBlockNumber Reference to a property on the _blockTracker: the number (i.e. an id) of the the current block
   *
   */
  constructor(opts = {}) {
    const initState = {
      accounts: {},
      currentBlockGasLimit: '',
    };
    this.store = new ObservableStore(initState);

    this._provider = opts.provider;
    this._query = pify(new EthQuery(this._provider));
    this._blockTracker = opts.blockTracker;
    // blockTracker.currentBlock may be null
    this._currentBlockNumber = this._blockTracker.getCurrentBlock();
    this._blockTracker.once('latest', (blockNumber) => {
      this._currentBlockNumber = blockNumber;
    });
    // bind function for easier listener syntax
    this._updateForBlock = this._updateForBlock.bind(this);
    this.network = opts.network;
    this.getCurrentChainId = opts.getCurrentChainId;

    this.web3 = new Web3(this._provider);
  }

  start() {
    // remove first to avoid double add
    this._blockTracker.removeListener('latest', this._updateForBlock);
    // add listener
    this._blockTracker.addListener('latest', this._updateForBlock);
    // fetch account balances
    this._updateAccounts();
  }

  stop() {
    // remove listener
    this._blockTracker.removeListener('latest', this._updateForBlock);
  }

  /**
   * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
   * AccountTracker.
   *
   * Once this AccountTracker's accounts are up to date with those referenced by the passed addresses, each
   * of these accounts are given an updated balance via EthQuery.
   *
   * @param {array} address - The array of hex addresses for accounts with which this AccountTracker's accounts should be
   * in sync
   *
   */
  syncWithAddresses(addresses) {
    const { accounts } = this.store.getState();
    const locals = Object.keys(accounts);

    const accountsToAdd = [];
    addresses.forEach((upstream) => {
      if (!locals.includes(upstream)) {
        accountsToAdd.push(upstream);
      }
    });

    const accountsToRemove = [];
    locals.forEach((local) => {
      if (!addresses.includes(local)) {
        accountsToRemove.push(local);
      }
    });

    this.addAccounts(accountsToAdd);
    this.removeAccount(accountsToRemove);
  }

  /**
   * Adds new addresses to track the balances of
   * given a balance as long this._currentBlockNumber is defined.
   *
   * @param {array} addresses - An array of hex addresses of new accounts to track
   *
   */
  addAccounts(addresses) {
    const { accounts } = this.store.getState();
    // add initial state for addresses
    addresses.forEach((address) => {
      accounts[address] = {};
    });
    // save accounts state
    this.store.updateState({ accounts });
    // fetch balances for the accounts if there is block number ready
    if (!this._currentBlockNumber) {
      return;
    }
    this._updateAccounts();
  }

  /**
   * Removes accounts from being tracked
   *
   * @param {array} an - array of hex addresses to stop tracking
   *
   */
  removeAccount(addresses) {
    const { accounts } = this.store.getState();
    // remove each state object
    addresses.forEach((address) => {
      delete accounts[address];
    });
    // save accounts state
    this.store.updateState({ accounts });
  }

  /**
   * Removes all addresses and associated balances
   */

  clearAccounts() {
    this.store.updateState({ accounts: {} });
  }

  /**
   * Given a block, updates this AccountTracker's currentBlockGasLimit, and then updates each local account's balance
   * via EthQuery
   *
   * @private
   * @param {number} blockNumber - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   *
   */
  async _updateForBlock(blockNumber) {
    this._currentBlockNumber = blockNumber;

    // block gasLimit polling shouldn't be in account-tracker shouldn't be here...
    const currentBlock = await this._query.getBlockByNumber(blockNumber, false);
    if (!currentBlock) {
      return;
    }
    const currentBlockGasLimit = currentBlock.gasLimit;
    this.store.updateState({ currentBlockGasLimit });

    try {
      await this._updateAccounts();
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * balanceChecker is deployed on main eth (test)nets and requires a single call
   * for all other networks, calls this._updateAccount for each account in this.store
   *
   * @returns {Promise} - after all account balances updated
   *
   */
  async _updateAccounts() {
    const { accounts } = this.store.getState();
    const addresses = Object.keys(accounts);
    if (!addresses?.length) {
      return;
    }
    const currentNetwork = this.network.getNetworkState();
    if (!currentNetwork?.length) {
      return;
    }
    const currentChainId = addHexPrefix(Number(currentNetwork).toString(16));
    const singleCallBalanceAddress =
      SINGLE_CALL_BALANCES_ADDRESSES[currentChainId];
    if (
      singleCallBalanceAddress &&
      (currentChainId !== THETAMAINNET_CHAIN_ID ||
        !this.network.getSelectedNative())
    ) {
      await this._updateAccountsViaBalanceChecker(
        addresses,
        singleCallBalanceAddress,
      );
    } else {
      await Promise.all(addresses.map(this._updateAccount.bind(this)));
    }
  }

  async _getThetaBal(address) {
    let bal;
    try {
      if (!this.thetaProvider) {
        this.thetaProvider = new thetajs.providers.HttpProvider(
          THETAMAINNET_CHAIN_ID,
          THETAMAINNET_NATIVE_RPC_URL,
        );
      }
      const getThetaWei = async (addr) => {
        const result2 = await this.thetaProvider.getAccount(addr);
        return bnToHex(new BN(result2.coins.thetawei));
      };
      bal = await getThetaWei(address);
    } catch (error) {
      if (
        error.message.toLowerCase() ===
        `account with address ${address.toLowerCase()} is not found`
      ) {
        bal = '0x0';
      } else {
        log.warn(
          `MetaMask - account-tracker._updateAccount theta balance fetch failed`,
          error,
        );
        bal = null;
      }
    }
    return bal;
  }

  /**
   * Updates the current balance of an account.
   *
   * @private
   * @param {string} address - A hex address of a the account to be updated
   * @returns {Promise} - after the account balance is updated
   *
   */
  async _updateAccount(address) {
    // query balances
    const pBalance = this._query.getBalance(address);
    const chainId = this.getCurrentChainId();
    const pBalance2 =
      chainId === THETAMAINNET_CHAIN_ID
        ? this._getThetaBal(address)
        : Promise.resolve(undefined);
    const pStakes =
      chainId === THETAMAINNET_CHAIN_ID
        ? this._getStakesOnTheta(address)
        : Promise.resolve(undefined);
    const [balance, balance2, stakes] = await Promise.all([
      pBalance,
      pBalance2,
      pStakes,
    ]);
    const result = { address, balance, balance2, stakes };

    // update accounts state
    const { accounts } = this.store.getState();
    // only populate if the entry is still present
    if (!accounts[address]) {
      return;
    }
    accounts[address] = result;
    this.store.updateState({ accounts });
  }

  /**
   * Updates current address balances from balanceChecker deployed contract instance
   * @param {*} addresses
   * @param {*} deployedContractAddress
   */
  async _updateAccountsViaBalanceChecker(addresses, deployedContractAddress) {
    const { accounts } = this.store.getState();
    this.web3.setProvider(this._provider);
    const ethContract = this.web3.eth
      .contract(SINGLE_CALL_BALANCES_ABI)
      .at(deployedContractAddress);
    const ethBalance = ['0x0'];

    ethContract.balances(addresses, ethBalance, (error, result) => {
      if (error) {
        log.warn(
          `MetaMask - Account Tracker single call balance fetch failed`,
          error,
        );
        Promise.all(addresses.map(this._updateAccount.bind(this)));
        return;
      }
      addresses.forEach((address, index) => {
        const balance = bnToHex(result[index]);
        accounts[address] = { address, balance };
      });
      this.store.updateState({ accounts });
    });
  }

  async _getStakesOnTheta(address) {
    const pNativeStakes = this._getThetaNativeStakes(address);
    const pTokenStakes = this._getThetaTokenStakes(address);
    const [nativeStakes, tokenStakes] = await Promise.all([
      pNativeStakes,
      pTokenStakes,
    ]);
    return [...nativeStakes, ...tokenStakes];
  }

  async _getThetaNativeStakes(address) {
    const rawStakes = await new Promise((resolve, reject) => {
      request(
        {
          url: `${THETAMAINNET_EXPLORER_API_URL}/api/stake/${address}?types[]=vcp&types[]=gcp&types[]=eenp&hasBalance=true`,
          method: 'get',
          json: true,
        },
        (err, res, body) => {
          if (err) {
            console.error(
              'ERROR fetching account native stakes: ',
              JSON.stringify(err),
            );
            reject(err);
            return;
          }
          if (body.error) {
            console.error(
              'ERROR checking account native stakes: ',
              JSON.stringify(body.error),
            );
            reject(new Error(body.error?.message));
            return;
          }
          if (res.statusCode === 200) {
            resolve(body.body?.sourceRecords);
          } else {
            console.error(
              `ERROR getting theta native stakes: http code ${res.statusCode}`,
            );
            reject(res.statusCode);
          }
        },
      );
    });

    return rawStakes
      .map((e) => {
        let symbol, purpose;
        switch (true) {
          case e.type === 'gcp':
            symbol = THETA_SYMBOL;
            purpose = thetajs.constants.StakePurpose.StakeForGuardian;
            break;
          case e.type === 'vcp':
            symbol = THETA_SYMBOL;
            purpose = thetajs.constants.StakePurpose.StakeForValidator;
            break;
          case e.type.slice(0, 3) === 'een':
            symbol = TFUEL_SYMBOL;
            purpose = thetajs.constants.StakePurpose.StakeForEliteEdge;
            break;
          default:
        }
        return {
          symbol,
          type: e.type,
          amount: bnToHex(new BN(e.amount)),
          holder: e.holder,
          purpose,
          withdrawn: e.withdrawn,
          return_height: e.return_height,
        };
      })
      .filter((e) => e.symbol);
  }

  async _getThetaTokenStakes(address) {
    return (
      await Promise.all(
        Object.values(thetaTokens)
          .filter((t) => t.staking)
          .map(async (t) => {
            let type, amount, stakedShares;
            if (t.staking.functionSigs?.estimateTokensOwned) {
              type = 'shares';
              [amount, stakedShares] = await Promise.all([
                this._getEstimatedTokensOwned(t, address),
                this._getStakedShares(t, address),
              ]);
            } // for other tokens may need different calls but there are no others at the moment

            return {
              symbol: t.symbol,
              type,
              amount,
              stakedShares,
              holder: t.staking.stakingAddress,
              token: t,
            };
          }),
      )
    ).filter((e) => e.amount !== '0x0');
  }

  async _getEstimatedTokensOwned(token, selectedAddress) {
    const amount = await this._query.call({
      from: selectedAddress,
      to: token.staking.stakingAddress,
      data:
        token.staking.functionSigs.estimateTokensOwned +
        selectedAddress.slice(2).padStart(64, '0'),
    });
    const out = amount.replace(/^0x[0]+(\d)/u, '0x$1'); // removes leading zeros
    return out === '0x' ? '0x0' : out;
  }

  async _getStakedShares(token, selectedAddress) {
    const amount = await this._query.call({
      from: selectedAddress,
      to: token.staking.stakingAddress,
      data:
        token.staking.functionSigs.stakedShares +
        selectedAddress.slice(2).padStart(64, '0'),
    });
    const out = amount.replace(/^0x[0]+(\d)/u, '0x$1'); // removes leading zeros
    return out === '0x' ? '0x0' : out;
  }
}
