import { useSelector } from 'react-redux';
import {
  ETH_TOKEN_IMAGE_URL,
  TFUEL_TOKEN_IMAGE_URL,
} from '../../app/scripts/controllers/network/enums';
import { getNativeCurrency } from '../selectors';

export function useNativeCurrencyImage() {
  const nativeCurrency = useSelector(getNativeCurrency);
  switch (nativeCurrency) {
    case 'ETH':
      return ETH_TOKEN_IMAGE_URL;
    case 'TFUEL':
      return TFUEL_TOKEN_IMAGE_URL;
    default:
      return undefined;
  }
}
