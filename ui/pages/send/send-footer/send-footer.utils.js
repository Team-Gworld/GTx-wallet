import ethUtil from 'ethereumjs-util';
import { generateTokenTransferData } from '../send.utils';
import { ASSET_TYPE } from '../../../../shared/constants/transaction';

export function addHexPrefixToObjectValues(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    return { ...newObj, [key]: ethUtil.addHexPrefix(obj[key]) };
  }, {});
}

export function constructTxParams({
  sendAsset,
  data,
  to,
  amount,
  from,
  gas,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
  isThetaNative,
  thetaTxType,
  additional,
}) {
  const gasPriceParams = maxFeePerGas
    ? { maxFeePerGas, maxPriorityFeePerGas }
    : { gasPrice };
  const txParams = {
    data,
    from,
    value: '0',
    gas,
    ...gasPriceParams,
    ...(isThetaNative && { isThetaNative }),
    ...(thetaTxType && { thetaTxType }),
    ...(additional && { additional }),
  };

  if (sendAsset.address) {
    txParams.to = sendAsset.address;
  } else {
    txParams.to = to;
    if (sendAsset?.type === ASSET_TYPE.NATIVE2) {
      txParams.value2 = amount;
    } else {
      txParams.value = amount;
    }
  }

  return addHexPrefixToObjectValues(txParams);
}

export function constructUpdatedTx({
  sendAsset,
  data,
  to,
  amount,
  from, // eslint-disable-line no-unused-vars
  gas,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
  isThetaNative, // eslint-disable-line no-unused-vars
  thetaTxType, // eslint-disable-line no-unused-vars
  additional, // eslint-disable-line no-unused-vars
  editingTransactionId,
  unapprovedTxs,
}) {
  const unapprovedTx = unapprovedTxs[editingTransactionId];
  const gasPriceParams = maxFeePerGas
    ? { maxFeePerGas, maxPriorityFeePerGas }
    : { gasPrice };

  const opts = {
    ...(arguments[0] || {}), // eslint-disable-line prefer-rest-params
    data: unapprovedTx.txParams.data ?? data,
  };
  if (!data && sendAsset?.address) {
    if (sendAsset.isERC721) {
      throw new Error('Editing NFT transfer tx is not supported');
    }
    opts.data = generateTokenTransferData({
      toAddress: to,
      amount,
      sendAsset,
    });
  }

  const newTx = constructTxParams(opts); // eslint-disable-line prefer-rest-params

  const editingTx = {
    ...unapprovedTx,
    txParams: Object.assign(
      unapprovedTx.txParams,
      addHexPrefixToObjectValues({
        ...(newTx.data && { data: newTx.data }),
        to: newTx.to,
        from: newTx.from,
        gas,
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

export function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized,
  );
  return !foundMatching;
}
