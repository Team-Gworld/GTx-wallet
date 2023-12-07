import ethUtil from 'ethereumjs-util';
import { constants as thetaConstants } from '@thetalabs/theta-js';
import {
  generateStakeTokenData,
  generateTokenApproveData,
  generateUnstakeSharesData,
} from '../../send/send.utils';
import {
  ASSET_TYPE,
  ASSET_MODE,
} from '../../../../shared/constants/transaction';
import {
  THETA_GAS_EST_PER_TDROP_STAKE_UNSTAKE,
  THETA_GAS_PER_TRANSFER_HEXWEI,
} from '../../../../app/scripts/controllers/network/enums';
import { BASE_TOKEN_GAS_COST } from '../../send/send.constants';

export function addHexPrefixToObjectValues(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) };
  }, {});
}

export function constructTxParams({
  sendAsset,
  amount,
  from,
  gas: gasEstimate,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) {
  const gasPriceParams = maxFeePerGas
    ? { maxFeePerGas, maxPriorityFeePerGas }
    : { gasPrice };

  const isThetaNative = true;
  let to, value, value2, data, gas, thetaTxType, additional;
  switch (sendAsset.type) {
    case ASSET_TYPE.TOKEN:
      switch (sendAsset.mode) {
        case ASSET_MODE.STAKE:
          thetaTxType = thetaConstants.TxType.SmartContract;
          data = generateStakeTokenData({
            amount,
            sendAsset,
          });
          to = sendAsset.staking.stakingAddress;
          gas =
            (gasEstimate !== '0x0' && gasEstimate) ||
            THETA_GAS_EST_PER_TDROP_STAKE_UNSTAKE;
          break;

        case ASSET_MODE.UNSTAKE:
          thetaTxType = thetaConstants.TxType.SmartContract;
          data = generateUnstakeSharesData({
            amount,
            sendToken: sendAsset?.stakedToken ?? sendAsset,
          });
          to = sendAsset.address;
          gas =
            (gasEstimate !== '0x0' && gasEstimate) ||
            THETA_GAS_EST_PER_TDROP_STAKE_UNSTAKE;
          break;

        case ASSET_MODE.APPROVE:
          thetaTxType = thetaConstants.TxType.SmartContract;
          data = generateTokenApproveData({
            spender: sendAsset.staking?.stakingAddress,
            amount,
            sendToken: sendAsset,
          });
          to = sendAsset.address;
          gas = (gasEstimate !== '0x0' && gasEstimate) || BASE_TOKEN_GAS_COST;
          break;

        default:
          throw new Error(
            `Invalid mode. Should be stake/unstake. Got: ${sendAsset.mode}`,
          );
      }
      break;

    case ASSET_TYPE.NATIVE2:
      switch (sendAsset.mode) {
        case ASSET_MODE.STAKE:
          switch (sendAsset.stake?.purpose) {
            case thetaConstants.StakePurpose.StakeForGuardian:
              thetaTxType = thetaConstants.TxType.DepositStakeV2;
              additional = {
                holderSummary: sendAsset.stake?.holderSummary,
                holder: sendAsset.stake?.holder,
                purpose: sendAsset.stake?.purpose,
              };
              break;

            case thetaConstants.StakePurpose.StakeForValidator:
              thetaTxType = thetaConstants.TxType.DepositStake;
              additional = {
                purpose: sendAsset.stake?.purpose,
                holder: sendAsset.stake?.holder,
              };
              break;

            default:
              throw new Error(
                `Invalid stake purpose. Got ${sendAsset.stake?.purpose}`,
              );
          }
          value2 = amount;
          to =
            sendAsset.stake?.holder ||
            sendAsset.stake?.holderSummary?.slice(0, 42);
          gas = THETA_GAS_PER_TRANSFER_HEXWEI;
          break;

        case ASSET_MODE.UNSTAKE:
          switch (sendAsset.stake?.purpose) {
            case thetaConstants.StakePurpose.StakeForGuardian:
            case thetaConstants.StakePurpose.StakeForValidator:
              break;
            default:
              throw new Error(
                `Invalid unstake purpose. Got ${sendAsset.stake?.purpose}`,
              );
          }
          thetaTxType = thetaConstants.TxType.WithdrawStake;
          additional = {
            purpose: sendAsset.stake?.purpose,
            holder: sendAsset.stake?.holder,
          };
          to =
            sendAsset.stake?.holder ||
            sendAsset.stake?.holderSummary?.slice(0, 42);
          gas = THETA_GAS_PER_TRANSFER_HEXWEI;
          break;

        default:
          throw new Error(
            `Invalid mode. Should be stake/unstake. Got: ${sendAsset.mode}`,
          );
      }
      break;

    case ASSET_TYPE.NATIVE:
      switch (sendAsset.mode) {
        case ASSET_MODE.STAKE:
          thetaTxType = thetaConstants.TxType.DepositStakeV2;
          additional = {
            holderSummary: sendAsset.stake?.holderSummary,
            holder: sendAsset.stake?.holder,
            purpose: sendAsset.stake?.purpose,
          };
          value = amount;
          to =
            sendAsset.stake?.holder ||
            sendAsset.stake?.holderSummary?.slice(0, 42);
          if (sendAsset.type === ASSET_TYPE.NATIVE) {
            gas = THETA_GAS_PER_TRANSFER_HEXWEI;
          }
          break;

        case ASSET_MODE.UNSTAKE:
          thetaTxType = thetaConstants.TxType.WithdrawStake;
          additional = {
            purpose: sendAsset.stake?.purpose,
            holder: sendAsset.stake?.holder,
          };
          to =
            sendAsset.stake?.holder ||
            sendAsset.stake?.holderSummary?.slice(0, 42);
          if (sendAsset.type === ASSET_TYPE.NATIVE) {
            gas = THETA_GAS_PER_TRANSFER_HEXWEI;
          }
          break;

        default:
          console.warn(
            `Invalid asset mode in updateDraftTransaction: '${sendAsset.mode}'`,
          );
          data = undefined;
          thetaTxType = undefined;
      }
      break;

    default:
      throw new Error(
        `Asset type must be native/native2/token for stake/unstake. Got ${sendAsset.type}`,
      );
  }

  const txParams = {
    from,
    to,
    value: value || '0x0',
    ...(value2 && { value2 }),
    data,
    gas,
    ...gasPriceParams,
    isThetaNative,
    thetaTxType,
    ...(additional && { additional }),
  };

  return addHexPrefixToObjectValues(txParams);
}

export function constructUpdatedTx({
  sendAsset,
  amount,
  from,
  gas,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
  editingTransactionId,
  unapprovedTxs,
}) {
  const unapprovedTx = unapprovedTxs[editingTransactionId];
  const gasPriceParams = maxFeePerGas
    ? { maxFeePerGas, maxPriorityFeePerGas }
    : { gasPrice };

  const newTx = constructTxParams({
    sendAsset,
    amount,
    from,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  const editingTx = {
    ...unapprovedTx,
    txParams: Object.assign(
      unapprovedTx.txParams,
      addHexPrefixToObjectValues({
        ...(newTx.data && { data: newTx.data }),
        to: newTx.to,
        from: newTx.from,
        gas: gas ?? newTx.gas,
        ...gasPriceParams,
        value: newTx.value,
        ...(newTx.value2 && { value2: newTx.value2 }),
        ...(newTx.isThetaNative && { isThetaNative: newTx.isThetaNative }),
        ...(newTx.thetaTxType && { thetaTxType: newTx.thetaTxType }),
        ...(newTx.additional && { additional: newTx.additional }),
      }),
    ),
  };

  return editingTx;
}
