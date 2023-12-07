import abi from 'ethereumjs-abi';
import { constants as thetaConstants } from '@thetalabs/theta-js';
import ethUtil, { addHexPrefix } from 'ethereumjs-util';
import {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
} from '../../helpers/utils/conversion-util';
import * as theta from '../../../shared/constants/theta';
import thetaTokens from '../../../gtx/theta-tokens.json';
import { calcTokenAmount } from '../../helpers/utils/token-util';
import { isSmartContractAddress } from '../../helpers/utils/transactions.util';
import {
  TFUEL_SYMBOL,
  THETAMAINNET_NETWORK_ID,
  THETA_GAS_PER_TRANSFER_HEXWEI,
  THETA_SYMBOL,
} from '../../../app/scripts/controllers/network/enums';
import {
  ASSET_MODE,
  ASSET_TYPE,
  TRANSACTION_TYPE,
} from '../../../shared/constants/transaction';
import {
  MAX_TFUEL_STAKE_EEN,
  MIN_TFUEL_FOR_TF_WRAP,
  MIN_TFUEL_FOR_WRAP_UNWRAP,
  MIN_TFUEL_STAKE_EEN,
  MIN_THETA_STAKE_GUARDIAN,
  MIN_THETA_STAKE_VALIDATOR,
} from '../stake/stake.constants';
import {
  BASE_TOKEN_GAS_COST,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  MIN_GAS_LIMIT_HEX,
  NEGATIVE_ETH_ERROR,
  SIMPLE_GAS_COST,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FUNCTION_SIGNATURE,
  APPROVE_FUNCTION_SIGNATURE,
  AMOUNT_LESS_THAN_MINIMUM_STAKE,
  AMOUNT_MORE_THAN_MAXIMUM_STAKE,
  INSUFFICIENT_FUNDS_FOR_TF_WRAP_ERROR,
  INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR,
  INSUFFICIENT_ALLOWANCE_FOR_STAKE_ERROR,
} from './send.constants';

export {
  addGasBuffer,
  calcGasTotal,
  calcTokenBalance,
  doesAmountErrorRequireUpdate,
  estimateGas,
  generateTokenTransferData,
  generateTokenApproveData,
  generateNFTTransferData,
  generateStakeTokenData,
  generateUnstakeSharesData,
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  isBalanceSufficient,
  isBalance2Sufficient,
  isTokenBalanceSufficient,
  removeLeadingZeroes,
  ellipsify,
  wrapInfoFromTxParams,
  stakeInfoFromTxData,
  isAssetTokenLike,
};

const { BigInt } = window;

function calcGasTotal(gasLimit = '0', gasPrice = '0') {
  return multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  });
}

function isBalanceSufficient({
  amount = '0x0',
  balance = '0x0',
  conversionRate = 1,
  gasTotal = '0x0',
  primaryCurrency,
}) {
  const totalAmount = addCurrencies(amount, gasTotal, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
  });

  const balanceIsSufficient = conversionGTE(
    {
      value: balance,
      fromNumericBase: 'hex',
      fromCurrency: primaryCurrency,
      conversionRate,
    },
    {
      value: totalAmount,
      fromNumericBase: 'hex',
      conversionRate,
      fromCurrency: primaryCurrency,
    },
  );

  return balanceIsSufficient;
}

function isBalance2Sufficient({ amount = '0x0', balance2 = '0x0' }) {
  const balanceIsSufficient = conversionGTE(
    {
      value: balance2,
      fromNumericBase: 'hex',
    },
    {
      value: amount,
      fromNumericBase: 'hex',
    },
  );

  return balanceIsSufficient;
}

function isTokenBalanceSufficient({ amount = '0x0', tokenBalance, decimals }) {
  const amountInDec = conversionUtil(amount, {
    fromNumericBase: 'hex',
  });

  const tokenBalanceIsSufficient = conversionGTE(
    {
      value: tokenBalance,
      fromNumericBase: 'hex',
    },
    {
      value: calcTokenAmount(amountInDec, decimals),
    },
  );

  return tokenBalanceIsSufficient;
}

function getAmountErrorObject({
  amount: inAmount,
  balance,
  balance2,
  conversionRate,
  gasTotal,
  primaryCurrency,
  sendAsset,
  tokenBalance,
}) {
  const { decimals } = sendAsset || {};
  const amount = ethUtil.addHexPrefix(inAmount);

  let error = null;
  switch (true) {
    case sendAsset?.mode === ASSET_MODE.UNSTAKE &&
      sendAsset.type === ASSET_TYPE.TOKEN &&
      tokenBalance &&
      !isTokenBalanceSufficient({
        tokenBalance,
        amount,
        decimals,
      }):
      error = INSUFFICIENT_TOKENS_ERROR;
      break;

    case sendAsset?.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.NATIVE2 &&
      sendAsset.stake?.purpose ===
        thetaConstants.StakePurpose.StakeForValidator &&
      BigInt(amount) < BigInt(MIN_THETA_STAKE_VALIDATOR):
      error = AMOUNT_LESS_THAN_MINIMUM_STAKE;
      break;

    case sendAsset?.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.NATIVE2 &&
      sendAsset.stake?.purpose !==
        thetaConstants.StakePurpose.StakeForValidator && // defaults to StakeForGuardian
      BigInt(amount) < BigInt(MIN_THETA_STAKE_GUARDIAN):
      error = AMOUNT_LESS_THAN_MINIMUM_STAKE;
      break;

    case sendAsset?.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.NATIVE &&
      BigInt(amount) < BigInt(MIN_TFUEL_STAKE_EEN):
      error = AMOUNT_LESS_THAN_MINIMUM_STAKE;
      break;

    case sendAsset?.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.NATIVE &&
      BigInt(amount) > BigInt(MAX_TFUEL_STAKE_EEN):
      error = AMOUNT_MORE_THAN_MAXIMUM_STAKE;
      break;

    // set error to INSUFFICIENT_FUNDS_FOR_TF_WRAP_ERROR if the account balance is lower
    // than the minimum balance required to wrap TFuel
    case sendAsset?.type === ASSET_TYPE.NATIVE &&
      sendAsset.mode === ASSET_MODE.WRAP &&
      !isBalanceSufficient({
        amount,
        gasTotal: MIN_TFUEL_FOR_TF_WRAP,
        balance,
      }):
      error = INSUFFICIENT_FUNDS_FOR_TF_WRAP_ERROR;
      break;

    // set error to INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR if the account balance is lower
    // than the minimum balance required to unwrap tfuel
    case sendAsset?.type === ASSET_TYPE.NATIVE &&
      sendAsset.mode === ASSET_MODE.UNWRAP &&
      !isBalanceSufficient({
        amount: '0x0',
        gasTotal: MIN_TFUEL_FOR_WRAP_UNWRAP, // TODO: theta wallet appears to not have this requirement that Theta RPC is requiring, alter to emulate the less restrictive behavior
        balance,
      }):
      error = INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR;
      break;

    // set error to INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR if the account balance is lower
    // than the minimum balance required to wrap or unwrap theta
    case ((sendAsset?.type === ASSET_TYPE.NATIVE2 &&
      sendAsset.mode === ASSET_MODE.WRAP) ||
      sendAsset.mode === ASSET_MODE.UNWRAP) &&
      !isBalanceSufficient({
        amount: '0x0',
        gasTotal: MIN_TFUEL_FOR_WRAP_UNWRAP,
        balance,
      }):
      error = INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR;
      break;

    // set error to INSUFFICIENT_FUNDS_ERROR if the account balance is lower
    // than the total price of the transaction inclusive of gas fees.
    case sendAsset?.type === ASSET_TYPE.NATIVE &&
      gasTotal &&
      !isBalanceSufficient({
        amount,
        balance,
        gasTotal,
      }):
      error = INSUFFICIENT_FUNDS_ERROR;
      break;

    // set error to INSUFFICIENT_FUNDS_ERROR if the account balance2 is lower
    // than the amount the user is attempting to send.
    case sendAsset?.type === ASSET_TYPE.NATIVE2 &&
      !isBalance2Sufficient({
        amount,
        balance2,
      }):
      error = INSUFFICIENT_FUNDS_ERROR;
      break;

    case sendAsset?.type === ASSET_TYPE.TOKEN &&
      sendAsset.mode === ASSET_MODE.APPROVE:
      error = null;
      break;

    // set error to INSUFFICIENT_FUNDS_ERROR if the token balance is lower
    // than the amount of token the user is attempting to send.
    case sendAsset?.type === ASSET_TYPE.TOKEN &&
      tokenBalance &&
      !isTokenBalanceSufficient({
        tokenBalance,
        amount,
        decimals,
      }):
      error = INSUFFICIENT_TOKENS_ERROR;
      break;

    case sendAsset?.type === ASSET_TYPE.TOKEN &&
      sendAsset.mode === ASSET_MODE.STAKE &&
      sendAsset.stakingAllowance &&
      !isTokenBalanceSufficient({
        tokenBalance: sendAsset.stakingAllowance ?? '0x0',
        amount,
        decimals,
      }):
      error = INSUFFICIENT_ALLOWANCE_FOR_STAKE_ERROR;
      break;

    // if the amount is negative, set error to NEGATIVE_ETH_ERROR
    case conversionGreaterThan(
      { value: 0, fromNumericBase: 'dec' },
      { value: amount, fromNumericBase: 'hex' },
    ):
      error = NEGATIVE_ETH_ERROR;
      break;

    // If none of the above are true, set error to null
    default:
      error = null;
  }

  return { amount: error };
}

function getGasFeeErrorObject({
  balance,
  conversionRate,
  gasTotal,
  primaryCurrency,
}) {
  let gasFeeError = null;

  if (gasTotal && conversionRate) {
    const insufficientFunds = !isBalanceSufficient({
      amount: '0x0',
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
    });

    if (insufficientFunds) {
      gasFeeError = INSUFFICIENT_FUNDS_ERROR;
    }
  }

  return { gasFee: gasFeeError };
}

function calcTokenBalance({ sendAsset, usersToken }) {
  const { decimals } = sendAsset || {};
  return calcTokenAmount(usersToken.balance.toString(), decimals).toString(16);
}

function doesAmountErrorRequireUpdate({
  balance,
  gasTotal,
  prevBalance,
  prevGasTotal,
  prevTokenBalance,
  sendAsset,
  tokenBalance,
}) {
  const balanceHasChanged = balance !== prevBalance;
  const gasTotalHasChange = gasTotal !== prevGasTotal;
  const tokenBalanceHasChanged =
    (sendAsset?.type === ASSET_TYPE.TOKEN ||
      sendAsset?.type === ASSET_TYPE.NFT) &&
    tokenBalance !== prevTokenBalance;
  const amountErrorRequiresUpdate =
    balanceHasChanged || gasTotalHasChange || tokenBalanceHasChanged;

  return amountErrorRequiresUpdate;
}

async function estimateGas({
  selectedAddress,
  sendAsset,
  blockGasLimit = MIN_GAS_LIMIT_HEX,
  to,
  value,
  data,
  estimatedGasPrice,
  estimateGasMethod,
  network,
  selectedNative,
}) {
  const txParamsForGasEstimate = {
    from: selectedAddress,
    value,
    gasPrice: estimatedGasPrice,
  };

  // if recipient has no code, gas is 21k max:
  const isThetaNative = network === THETAMAINNET_NETWORK_ID && selectedNative;
  if (!isThetaNative) {
    if (!sendAsset?.address && !data) {
      const isSmartContract = Boolean(to) && await isSmartContractAddress(to);
      if (!isSmartContract) {
        return SIMPLE_GAS_COST;
      }
    } else if (sendAsset?.address && !to) {
      return BASE_TOKEN_GAS_COST;
    }
  } else if (
    [ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(sendAsset.type) &&
    sendAsset.mode === ASSET_MODE.SEND
  ) {
    return THETA_GAS_PER_TRANSFER_HEXWEI;
  }

  if (sendAsset?.address) {
    txParamsForGasEstimate.value = '0x0';
    switch (sendAsset.type) {
      case ASSET_TYPE.TOKEN:
        switch (sendAsset.mode) {
          case ASSET_MODE.SEND:
            txParamsForGasEstimate.data = generateTokenTransferData({
              toAddress: to,
              amount: value,
              sendAsset,
            });
            txParamsForGasEstimate.to = sendAsset.address;
            break;

          case ASSET_MODE.APPROVE:
            txParamsForGasEstimate.data = generateTokenApproveData({
              spender: sendAsset.staking?.stakingAddress,
              amount: value,
              sendToken: sendAsset,
            });
            txParamsForGasEstimate.to = sendAsset.address;
            break;

          case ASSET_MODE.STAKE:
            txParamsForGasEstimate.data = generateStakeTokenData({
              amount: value && value !== '0' && value !== '0x0' ? value : '0x1', // prevents revert error on tdrop stake contract
              sendAsset,
            });
            txParamsForGasEstimate.to = sendAsset.staking?.stakingAddress;
            break;

          case ASSET_MODE.UNSTAKE:
            txParamsForGasEstimate.data = generateUnstakeSharesData({
              amount: value && value !== '0' && value !== '0x0' ? value : '0x1',
              sendToken: sendAsset,
            });
            txParamsForGasEstimate.to =
              sendAsset.staking?.stakingAddress || sendAsset.address;
            break;

          case ASSET_MODE.UNWRAP: {
            const amount =
              value && value !== '0' && value !== '0x0' ? value : '0x1';
            txParamsForGasEstimate.data = `${
              theta.fourBytes.withdraw
            }${addHexPrefix(amount).slice(2).padStart(64, '0')}`;
            txParamsForGasEstimate.to = sendAsset.address;
            break;
          }

          default:
            console.warn(
              `Invalid send mode in estimateGas. Got ${sendAsset.mode}`,
            );
        }
        break;

      case ASSET_TYPE.NFT:
        txParamsForGasEstimate.data = generateNFTTransferData({
          fromAddress: selectedAddress,
          toAddress: to,
          sendAsset,
          tokenID: sendAsset.tokenID,
        });
        break;

      default:
        console.warn(`Invalid send type in estimateGas. Got ${sendAsset.type}`);
        return isThetaNative
          ? THETA_GAS_PER_TRANSFER_HEXWEI
          : BASE_TOKEN_GAS_COST;
    }
  } else if (
    isThetaNative &&
    [ASSET_MODE.STAKE, ASSET_MODE.UNSTAKE].includes(sendAsset?.mode) &&
    [ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(sendAsset?.type)
  ) {
    return THETA_GAS_PER_TRANSFER_HEXWEI;
  } else if (isThetaNative && sendAsset?.mode === ASSET_MODE.WRAP) {
    if (sendAsset.type === ASSET_TYPE.NATIVE2) {
      return theta.WRAP_THETA_MAX_GAS_HEX; // TODO: use theta native smart contract gas estimator instead
    }
    txParamsForGasEstimate.data = theta.fourBytes.deposit;
    txParamsForGasEstimate.to = theta.contracts.WTFUEL;
    txParamsForGasEstimate.value =
      value && value !== '0' && value !== '0x0' ? value : '0x1'; // prevent reverts for contracts that do not allow 0 value transfers
  } else {
    if (data) {
      txParamsForGasEstimate.data = data;
    }

    if (to) {
      txParamsForGasEstimate.to = to;
    }

    if (!value || value === '0') {
      txParamsForGasEstimate.value = '0xff';
    }
  }

  // if not, fall back to block gasLimit
  if (!blockGasLimit) {
    // eslint-disable-next-line no-param-reassign
    blockGasLimit = MIN_GAS_LIMIT_HEX;
  }

  txParamsForGasEstimate.gas = ethUtil.addHexPrefix(
    multiplyCurrencies(blockGasLimit, 0.95, {
      multiplicandBase: 16,
      multiplierBase: 10,
      roundDown: '0',
      toNumericBase: 'hex',
    }),
  );

  // run tx
  try {
    const estimatedGas = await estimateGasMethod(txParamsForGasEstimate);
    const estimateWithBuffer = addGasBuffer(
      estimatedGas.toString(16),
      blockGasLimit,
      1.5,
    );
    return ethUtil.addHexPrefix(estimateWithBuffer);
  } catch (error) {
    const simulationFailed =
      error.message.includes('Transaction execution error.') ||
      error.message.includes(
        'gas required exceeds allowance or always failing transaction',
      );
    if (simulationFailed) {
      const estimateWithBuffer = addGasBuffer(
        txParamsForGasEstimate.gas,
        blockGasLimit,
        1.5,
      );
      return ethUtil.addHexPrefix(estimateWithBuffer);
    }
    throw error;
  }
}

function addGasBuffer(
  initialGasLimitHex,
  blockGasLimitHex,
  bufferMultiplier = 1.5,
) {
  const upperGasLimit = multiplyCurrencies(blockGasLimitHex, 0.9, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 10,
    numberOfDecimals: '0',
  });
  const bufferedGasLimit = multiplyCurrencies(
    initialGasLimitHex,
    bufferMultiplier,
    {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
      numberOfDecimals: '0',
    },
  );

  // if initialGasLimit is above blockGasLimit, dont modify it
  if (
    conversionGreaterThan(
      { value: initialGasLimitHex, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' },
    )
  ) {
    return initialGasLimitHex;
  }
  // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
  if (
    conversionLessThan(
      { value: bufferedGasLimit, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' },
    )
  ) {
    return bufferedGasLimit;
  }
  // otherwise use blockGasLimit
  return upperGasLimit;
}

function generateTokenTransferData({
  toAddress = '0x0',
  amount = '0x0',
  sendAsset,
}) {
  if (sendAsset.type !== ASSET_TYPE.TOKEN) {
    return undefined;
  }
  return (
    TOKEN_TRANSFER_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'uint256'],
          [toAddress, ethUtil.addHexPrefix(amount)],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function generateTokenApproveData({
  spender = '0x0',
  amount = '0x0',
  sendToken,
}) {
  if (!sendToken.address) {
    return undefined;
  }
  return (
    APPROVE_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'uint256'],
          [spender, ethUtil.addHexPrefix(amount)],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function generateNFTTransferData({
  fromAddress,
  toAddress = '0x0',
  sendAsset,
  tokenID,
}) {
  if (sendAsset.type !== ASSET_TYPE.NFT) {
    return undefined;
  }
  return (
    NFT_TRANSFER_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'address', 'uint256'],
          [fromAddress, toAddress, `0x${BigInt(tokenID).toString(16)}`],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function generateStakeTokenData({ amount = '0x0', sendAsset }) {
  if (!sendAsset?.staking?.functionSigs?.stake) {
    return undefined;
  }
  return (
    sendAsset.staking.functionSigs.stake +
    Array.prototype.map
      .call(abi.rawEncode(['uint256'], [ethUtil.addHexPrefix(amount)]), (x) => {
        return `00${x.toString(16)}`.slice(-2);
      })
      .join('')
  );
}

function generateUnstakeSharesData({ amount = '0x0', sendToken }) {
  if (
    !sendToken?.staking?.functionSigs?.unstakeShares &&
    !sendToken?.stakedAsset?.functionSigs?.unstakeShares
  ) {
    return undefined;
  }
  const unstakeShares =
    sendToken.staking?.functionSigs?.unstakeShares ??
    sendToken.stakedAsset?.functionSigs?.unstakeShares;
  return (
    unstakeShares +
    Array.prototype.map
      .call(abi.rawEncode(['uint256'], [ethUtil.addHexPrefix(amount)]), (x) =>
        `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function getToAddressForGasUpdate(...addresses) {
  return [...addresses, '']
    .find((str) => str !== undefined && str !== null)
    .toLowerCase();
}

function removeLeadingZeroes(str) {
  return str.replace(/^0*(?=\d)/u, '');
}

function ellipsify(text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`;
}

function wrapInfoFromTxParams(txParams) {
  const fourBytes = txParams?.data?.slice(0, 10);
  let tokenSymbol,
    tokenAddress,
    toAddress,
    tokenAmount,
    action,
    assetType,
    assetMode;
  switch (fourBytes) {
    case theta.fourBytes.deposit:
      action = 'wrap';
      assetMode = ASSET_MODE.WRAP;
      switch (txParams?.to) {
        case theta.contracts.WTFUEL:
          tokenSymbol = TFUEL_SYMBOL;
          tokenAddress = undefined;
          toAddress = theta.contracts.WTFUEL;
          tokenAmount = txParams.value ?? '0x0';
          assetType = ASSET_TYPE.NATIVE;
          break;
        case theta.contracts.WTHETA:
          tokenSymbol = THETA_SYMBOL;
          tokenAddress = undefined;
          toAddress = theta.contracts.WTHETA;
          tokenAmount = txParams.value2 ?? '0x0';
          assetType = ASSET_TYPE.NATIVE2;
          break;
        default:
          return undefined;
      }
      break;
    case theta.fourBytes.withdraw:
      action = 'unwrap';
      assetMode = ASSET_MODE.UNWRAP;
      switch (txParams?.to) {
        case theta.contracts.WTFUEL:
          tokenSymbol = 'WTFUEL';
          tokenAddress = theta.contracts.WTFUEL;
          toAddress = tokenAddress;
          tokenAmount = `0x${
            txParams.data?.slice(10, 74).replace(/^0+/u, '') || '0'
          }`;
          assetType = ASSET_TYPE.TOKEN;
          break;
        case theta.contracts.WTHETA:
          tokenSymbol = 'WTHETA';
          tokenAddress = theta.contracts.WTHETA;
          toAddress = tokenAddress;
          tokenAmount = `0x${
            txParams.data?.slice(10, 74).replace(/^0+/u, '') || '0'
          }`;
          assetType = ASSET_TYPE.TOKEN;
          break;
        default:
          return undefined;
      }
      break;
    default:
      return undefined;
  }
  return {
    tokenSymbol,
    tokenAddress,
    tokenAmount,
    toAddress,
    action,
    assetType,
    assetMode,
  };
}

function stakeInfoFromTxData(txMeta) {
  let action,
    tokenSymbol,
    tokenAddress,
    tokenAmount,
    assetType,
    assetMode,
    hasShares,
    stake,
    label,
    stakeToken;
  if (txMeta.type === TRANSACTION_TYPE.STAKE) {
    action = 'stake';
    assetMode = ASSET_MODE.STAKE;
  } else if (txMeta.type === TRANSACTION_TYPE.UNSTAKE) {
    action = 'unstake';
    assetMode = ASSET_MODE.UNSTAKE;
  } else {
    if (typeof txMeta.type !== 'undefined') {
      console.warn(
        `missing or invalid "type" (${txMeta.type}) in stakeInfoFromTxData`,
      );
    }
    return undefined;
  }
  switch (txMeta.txParams?.additional?.purpose) {
    case thetaConstants.StakePurpose.StakeForGuardian:
      tokenSymbol = THETA_SYMBOL;
      tokenAmount =
        txMeta.type === TRANSACTION_TYPE.STAKE ? txMeta.txParams.value2 : '0x0';
      assetType = ASSET_TYPE.NATIVE2;
      stake = {
        purpose: txMeta.txParams.additional.purpose,
        holderSummary: txMeta.txParams.additional.holderSummary,
        holder:
          txMeta.txParams.additional.holder ||
          txMeta.txParams.additional.holderSummary?.slice(0, 42),
      };
      label = 'toGuardian';
      break;
    case thetaConstants.StakePurpose.StakeForEliteEdge:
      tokenSymbol = TFUEL_SYMBOL;
      tokenAmount =
        txMeta.type === TRANSACTION_TYPE.STAKE ? txMeta.txParams.value : '0x0';
      assetType = ASSET_TYPE.NATIVE;
      stake = {
        purpose: txMeta.txParams.additional.purpose,
        holderSummary: txMeta.txParams.additional.holderSummary,
        holder:
          txMeta.txParams.additional.holder ||
          txMeta.txParams.additional.holderSummary?.slice(0, 42),
      };
      label = 'toEen';
      break;
    case thetaConstants.StakePurpose.StakeForValidator:
      tokenSymbol = THETA_SYMBOL;
      tokenAmount =
        txMeta.type === TRANSACTION_TYPE.STAKE ? txMeta.txParams.value2 : '0x0';
      assetType = ASSET_TYPE.NATIVE2;
      stake = {
        purpose: txMeta.txParams.additional.purpose,
        holder: txMeta.txParams.additional.holder,
      };
      label = 'toValidator';
      break;
    default: {
      const stakingTokens = Object.values(thetaTokens).filter((t) => t.staking);
      const token = stakingTokens.find(
        (t) =>
          t.staking.stakingAddress.toLowerCase() ===
          txMeta.txParams.to.toLowerCase(),
      );
      if (!token) {
        console.warn(
          `No staking token found for address "${txMeta.txParams.to}" or missing or invalid "purpose" (${txMeta.txParams?.additional?.purpose}) in stakeInfoFromTxData`,
        );
        return undefined;
      }
      tokenSymbol = token.symbol;
      tokenAddress = token.address;
      tokenAmount = `0x${
        txMeta.txParams.data?.slice(10, 74).replace(/^0+/u, '') || '0'
      }`;
      assetType = ASSET_TYPE.TOKEN;
      hasShares = Boolean(token.staking.functionSigs?.unstakeShares);
      label = 'toHolder';
      stake = {
        holder: token.staking.stakingAddress,
        amount: tokenAmount,
      };
      stakeToken = Object.values(thetaTokens).filter(
        (t) =>
          t.address.toLowerCase() ===
          token.staking.stakingAddress.toLowerCase(),
      )[0];
    }
  }
  return {
    tokenSymbol,
    tokenAddress,
    tokenAmount,
    toAddress: txMeta.txParams.to,
    action,
    assetType,
    assetMode,
    hasShares,
    stake,
    label,
    stakeToken,
  };
}

function isAssetTokenLike(sendAsset) {
  const type = sendAsset?.type;
  return type === ASSET_TYPE.TOKEN || type === ASSET_TYPE.NFT;
}
