import ethUtil from 'ethereumjs-util';
import { MethodRegistry } from 'eth-method-registry';
import abi from 'human-standard-token-abi';
import abiDecoder from 'abi-decoder';
import log from 'loglevel';
import request from 'request';
import * as thetajs from '@thetalabs/theta-js';
import { MESSAGE_TYPE } from '../../../app/scripts/lib/enums';
import {
  THETAMAINNET_CHAIN_ID,
  THETAMAINNET_NATIVE_RPC_URL,
  THETAMAINNET_NETWORK_ID,
} from '../../../app/scripts/controllers/network/enums';
import { getEtherscanNetworkPrefix } from '../../lib/etherscan-prefix-for-network';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../../../shared/constants/transaction';
import {
  SEND_ETHER_ACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  APPROVE_ACTION_KEY,
  SEND_TOKEN_ACTION_KEY,
  TRANSFER_FROM_ACTION_KEY,
  SIGNATURE_REQUEST_KEY,
  DECRYPT_REQUEST_KEY,
  ENCRYPTION_PUBLIC_KEY_REQUEST_KEY,
  CONTRACT_INTERACTION_KEY,
  CANCEL_ATTEMPT_ACTION_KEY,
  DEPOSIT_TRANSACTION_KEY,
  STAKE_ACTION_KEY,
  UNSTAKE_ACTION_KEY,
  WRAP_ACTION_KEY,
  UNWRAP_ACTION_KEY,
} from '../constants/transactions';
import fetchWithCache from './fetch-with-cache';
import { addCurrencies } from './conversion-util';

const { StakePurpose } = thetajs.constants;

abiDecoder.addABI(abi);

export function getTokenData(data = '') {
  return abiDecoder.decodeMethod(data);
}

async function getMethodFrom4Byte(fourBytePrefix) {
  const fourByteResponse = await fetchWithCache(
    `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
  );

  if (fourByteResponse.count === 1) {
    return fourByteResponse.results[0].text_signature;
  }
  return null;
}
let registry;

/**
 * Attempts to return the method data from the MethodRegistry library, the message registry library and the token abi, in that order of preference
 * @param {string} fourBytePrefix - The prefix from the method code associated with the data
 * @returns {Object}
 */
export async function getMethodDataAsync(fourBytePrefix) {
  try {
    const fourByteSig = getMethodFrom4Byte(fourBytePrefix).catch((e) => {
      log.error(e);
      return null;
    });

    if (!registry) {
      registry = new MethodRegistry({ provider: global.ethereumProvider });
    }

    let sig = await registry.lookup(fourBytePrefix);

    if (!sig) {
      sig = await fourByteSig;
    }

    if (!sig) {
      return {};
    }

    const parsedResult = registry.parse(sig);

    return {
      name: parsedResult.name,
      params: parsedResult.args,
    };
  } catch (error) {
    log.error(error);
    return {};
  }
}

export function isConfirmDeployContract(txData = {}) {
  const { txParams = {} } = txData;
  return !txParams.to;
}

/**
 * Returns four-byte method signature from data
 *
 * @param {string} data - The hex data (@code txParams.data) of a transaction
 * @returns {string} - The four-byte method signature
 */
export function getFourBytePrefix(data = '') {
  const prefixedData = ethUtil.addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  return fourBytePrefix;
}

/**
 * Given an transaction type, returns a boolean which indicates whether the transaction is calling an erc20 token method
 *
 * @param {string} type - The type of transaction being evaluated
 * @returns {boolean} - whether the transaction is calling an erc20 token method
 */
export function isTokenMethodAction(type) {
  return [
    TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER,
    TRANSACTION_TYPE.TOKEN_METHOD_APPROVE,
    TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM,
  ].includes(type);
}

/**
 * Returns the action of a transaction as a key to be passed into the translator.
 * @param {Object} transaction - txData object
 * @returns {string|undefined}
 */
export function getTransactionActionKey(transaction) {
  const { msgParams, type } = transaction;

  if (type === TRANSACTION_TYPE.INCOMING) {
    return DEPOSIT_TRANSACTION_KEY;
  }

  if (type === TRANSACTION_TYPE.CANCEL) {
    return CANCEL_ATTEMPT_ACTION_KEY;
  }

  if (msgParams) {
    if (type === MESSAGE_TYPE.ETH_DECRYPT) {
      return DECRYPT_REQUEST_KEY;
    } else if (type === MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY) {
      return ENCRYPTION_PUBLIC_KEY_REQUEST_KEY;
    }
    return SIGNATURE_REQUEST_KEY;
  }

  if (isConfirmDeployContract(transaction)) {
    return DEPLOY_CONTRACT_ACTION_KEY;
  }

  const isTokenAction = isTokenMethodAction(type);
  const isNonTokenSmartContract =
    type === TRANSACTION_TYPE.CONTRACT_INTERACTION;

  if (isTokenAction || isNonTokenSmartContract) {
    switch (type) {
      case TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER:
        return SEND_TOKEN_ACTION_KEY;
      case TRANSACTION_TYPE.TOKEN_METHOD_APPROVE:
        return APPROVE_ACTION_KEY;
      case TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM:
        return TRANSFER_FROM_ACTION_KEY;
      case TRANSACTION_TYPE.CONTRACT_INTERACTION:
        return CONTRACT_INTERACTION_KEY;
      case TRANSACTION_TYPE.STAKE:
        return STAKE_ACTION_KEY;
      case TRANSACTION_TYPE.UNSTAKE:
        return UNSTAKE_ACTION_KEY;
      case TRANSACTION_TYPE.TOKEN_METHOD_WRAP:
        return WRAP_ACTION_KEY;
      case TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP:
        return UNWRAP_ACTION_KEY;
      default:
        return undefined;
    }
  } else {
    return SEND_ETHER_ACTION_KEY;
  }
}

export function getLatestSubmittedTxWithNonce(
  transactions = [],
  nonce = '0x0',
) {
  if (!transactions.length) {
    return {};
  }

  return transactions.reduce((acc, current) => {
    const { submittedTime, txParams: { nonce: currentNonce } = {} } = current;

    if (currentNonce === nonce) {
      if (!acc.submittedTime) {
        return current;
      }
      return submittedTime > acc.submittedTime ? current : acc;
    }
    return acc;
  }, {});
}

export async function isSmartContractAddress(address, networkId = undefined) {
  const code = await _getCode(address, networkId);
  // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
  const codeIsEmpty = !code || code === '0x' || code === '0x0';
  return !codeIsEmpty;
}

async function _getCode(address, networkIdOrChainId = undefined) { // TODO: move to shared
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
  code = (await global.eth.getCode(address)) || null;
  return code;
}

export function sumHexes(...args) {
  const total = args.reduce((acc, base) => {
    return addCurrencies(acc, base, {
      toNumericBase: 'hex',
    });
  });

  return ethUtil.addHexPrefix(total);
}

/**
 * Returns a status key for a transaction. Requires parsing the txMeta.txReceipt on top of
 * txMeta.status because txMeta.status does not reflect on-chain errors.
 * @param {Object} transaction - The txMeta object of a transaction.
 * @param {Object} transaction.txReceipt - The transaction receipt.
 * @returns {string}
 */
export function getStatusKey(transaction) {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return 'failed';
  }

  if (
    status === TRANSACTION_STATUS.CONFIRMED &&
    type === TRANSACTION_TYPE.CANCEL
  ) {
    return 'cancelled';
  }

  return transaction.status;
}

/**
 * Returns an external block explorer URL at which a transaction can be viewed.
 * @param {number} networkId
 * @param {string} hash
 * @param {Object} rpcPrefs
 */
export function getBlockExplorerUrlForTx(networkId, hash, rpcPrefs = {}) {
  if (rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(/\/+$/u, '')}/tx/${hash}`;
  }
  const prefix = getEtherscanNetworkPrefix(networkId);
  return `https://${prefix}etherscan.io/tx/${hash}`;
}

export function getTransactionTypeTitle(t, type, additional = undefined) {
  switch (type) {
    case TRANSACTION_TYPE.STAKE: {
      switch (additional?.purpose) {
        case StakePurpose.StakeForEliteEdge:
          return t('stakeToNode', [t('een')]);
        case StakePurpose.StakeForGuardian:
          return t('stakeToNode', [t('guardianNode')]);
        case StakePurpose.StakeForValidator:
          return t('stakeToNode', [t('validatorNode')]);
        default:
          return t('stake');
      }
    }

    case TRANSACTION_TYPE.UNSTAKE: {
      switch (additional?.purpose) {
        case StakePurpose.StakeForEliteEdge:
          return t('unstakeFromNode', [t('een')]);
        case StakePurpose.StakeForGuardian:
          return t('unstakeFromNode', [t('guardianNode')]);
        case StakePurpose.StakeForValidator:
          return t('unstakeFromNode', [t('validatorNode')]);
        default:
          return t('unstake');
      }
    }

    case TRANSACTION_TYPE.CANCEL:
    case TRANSACTION_TYPE.RETRY:
    case TRANSACTION_TYPE.SENT_ETHER:
    case TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER:
    case TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM:
    case TRANSACTION_TYPE.TOKEN_METHOD_APPROVE:
    case TRANSACTION_TYPE.TOKEN_METHOD_WRAP:
    case TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP:
    case TRANSACTION_TYPE.INCOMING:
    case TRANSACTION_TYPE.CONTRACT_INTERACTION:
    case TRANSACTION_TYPE.DEPLOY_CONTRACT:
      return t(type);

    case TRANSACTION_TYPE.SIGN:
    case TRANSACTION_TYPE.SIGN_TYPED_DATA:
    case TRANSACTION_TYPE.PERSONAL_SIGN:
      return t('sign');

    case TRANSACTION_TYPE.ETH_DECRYPT:
      return t('decrypt');

    case TRANSACTION_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY:
      return t('encryptionPublicKeyRequest');

    default:
      throw new Error(`Unrecognized transaction type: ${type}`);
  }
}
