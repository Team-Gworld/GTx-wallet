import { useSelector } from 'react-redux';
import { getNativeCurrency } from '../selectors';

export function useNativeCurrency() {
  return useSelector(getNativeCurrency);
}
