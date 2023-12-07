import { useSelector } from 'react-redux';
import { addHexPrefix } from 'ethereumjs-util';
import { getCurrentNetwork } from '../selectors';

export function useCurrentNetwork() {
  return useSelector(getCurrentNetwork);
}

export function useCurrentChainId() {
  const networkId = parseInt(useCurrentNetwork(), 10);
  return networkId ? addHexPrefix(networkId.toString(16)) : undefined;
}
