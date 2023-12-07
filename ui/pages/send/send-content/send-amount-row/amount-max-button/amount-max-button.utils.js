import ethUtil from 'ethereumjs-util';
import {
  multiplyCurrencies,
  subtractCurrencies,
} from '../../../../../helpers/utils/conversion-util';
import { ASSET_TYPE } from '../../../../../../shared/constants/transaction';

export function calcMaxAmount({
  balance,
  balance2,
  gasTotal,
  sendAsset,
  tokenBalance,
}) {
  const { decimals = 18 } = sendAsset || {};
  const multiplier = Math.pow(10, Number(decimals || 0));

  return [ASSET_TYPE.TOKEN, ASSET_TYPE.NFT].includes(sendAsset?.type)
    ? multiplyCurrencies(
        sendAsset?.type === ASSET_TYPE.NFT &&
          ethUtil.addHexPrefix(tokenBalance ?? '0x0') !== '0x0'
          ? '0x1' // do not send more than 1 NFT at a time
          : tokenBalance,
        multiplier,
        {
          toNumericBase: 'hex',
          multiplicandBase: 16,
        },
      )
    : subtractCurrencies(
        ethUtil.addHexPrefix(
          sendAsset.type === ASSET_TYPE.NATIVE2 ? balance2 : balance,
        ),
        sendAsset.type === ASSET_TYPE.NATIVE2
          ? '0x0'
          : ethUtil.addHexPrefix(gasTotal),
        { toNumericBase: 'hex' },
      );
}
