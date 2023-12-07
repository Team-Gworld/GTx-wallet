import ethUtil, { addHexPrefix } from 'ethereumjs-util';
import { constants as thetaConstants } from '@thetalabs/theta-js';
import * as theta from '../../../../shared/constants/theta';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../shared/constants/transaction';

export function addHexPrefixToObjectValues(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) };
  }, {});
}

export function constructTxParams({
  sendAsset,
  amount,
  from,
  gas,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) {
  const gasPriceParams = maxFeePerGas
    ? { maxFeePerGas, maxPriorityFeePerGas }
    : { gasPrice };

  let to;
  let useGas = (gas && addHexPrefix(gas)) || '0x0';
  if (sendAsset.type === ASSET_TYPE.TOKEN) {
    to = sendAsset.address;
    if (useGas === '0x0') {
      useGas = to === theta.contracts.WTFUEL ? '0xd6d8' : '0x222e0';
    }
  } else if (sendAsset.type === ASSET_TYPE.NATIVE2) {
    to = theta.contracts.WTHETA;
    useGas = useGas === '0x0' ? '0x19a28' : useGas;
  } else {
    to = theta.contracts.WTFUEL;
    useGas = useGas === '0x0' ? '0xfde8' : useGas;
  }

  let data;
  if (sendAsset.mode === ASSET_MODE.WRAP) {
    data = theta.fourBytes.deposit;
  } else if (sendAsset.mode === ASSET_MODE.UNWRAP) {
    data = `${theta.fourBytes.withdraw}${addHexPrefix(amount)
      .slice(2)
      .padStart(64, '0')}`;
  }

  const txParams = {
    data,
    from,
    to,
    value: '0',
    gas: useGas,
    ...gasPriceParams,
    isThetaNative: true,
    thetaTxType: thetaConstants.TxType.SmartContract,
  };
  if (sendAsset.mode === ASSET_MODE.WRAP) {
    txParams[sendAsset.type === ASSET_TYPE.NATIVE2 ? 'value2' : 'value'] =
      amount;
  }

  return addHexPrefixToObjectValues(txParams);
}

export function constructUpdatedTx({
  sendAsset,
  amount,
  from,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gas,
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
