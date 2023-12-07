import { useState, useEffect, useRef, useCallback } from 'react';
import TokenTracker from '@metamask/eth-token-tracker';
import { useSelector } from 'react-redux';
import { addHexPrefix } from 'ethereumjs-util';
import { getCurrentNetwork, getSelectedAddress } from '../selectors';
import { lcDefaultTokens } from '../../gtx/mergedTokens';
import { useUnchanged } from './useUnchanged';

export function useTokenTracker(tokens) {
  const network = useSelector(getCurrentNetwork);
  const userAddress = useSelector(getSelectedAddress);

  const [loading, setLoading] = useState(() => tokens?.length >= 0);
  const [tokensWithBalances, setTokensWithBalances] = useState([]);
  const [error, setError] = useState(null);
  const tokenTracker = useRef(null);
  const memoizedTokens = useUnchanged(tokens);

  const updateBalances = useCallback(
    (tokensWithBalances_) => {
      const tokensWithTrueBalances = tokensWithBalances_.filter(
        (t) => t.balance && t.balance.toString() !== '0',
      );
      const matchingTokensWithBalsAndERC721Info = tokensWithTrueBalances.map(
        (twb) => {
          const fullTokenInfo = memoizedTokens.find(
            ({ address }) => address === twb.address,
          );
          return {
            ...twb,
            isERC721: fullTokenInfo?.isERC721,
            chainId: fullTokenInfo?.chainId,
            skipChainIds: fullTokenInfo?.skipChainIds,
            unsendable: fullTokenInfo?.unsendable,
          };
        },
      );
      setTokensWithBalances(matchingTokensWithBalsAndERC721Info);
      setLoading(false);
      setError(null);
    },
    [memoizedTokens],
  );

  const showError = useCallback((err) => {
    setError(err);
    setLoading(false);
  }, []);

  const teardownTracker = useCallback(() => {
    if (tokenTracker.current) {
      tokenTracker.current.stop();
      tokenTracker.current.removeAllListeners('update');
      tokenTracker.current.removeAllListeners('error');
      tokenTracker.current = null;
    }
  }, []);

  const buildTracker = useCallback(
    (address, tokenList, network_) => {
      // clear out previous tracker, if it exists.
      teardownTracker();

      const chainId = addHexPrefix(parseInt(network_, 10).toString(16));
      const useTokens = tokenList // TODO: use estimate gas to check if balanceOf is not callable and skip such tokens, to avoid logging warnings in some rare cases (cannot simply check for balanceOf function sig because of proxy contracts)
        .map((t) => {
          const token = { ...t };
          if (t.symbol && (t.isERC721 || t.decimals === 0)) {
            token.decimals = '0'; // so not falsey so token tracker will accept it
          }
          if (!t.symbol || t.decimals === undefined || t.decimals === null) {
            const known = lcDefaultTokens[t.address.toLowerCase()];
            if (known) {
              token.symbol = known.symbol;
              token.decimals = known.decimals.toString();
            }
          }
          return token;
        })
        .filter((t) => (!t.skipChainIds || !t.skipChainIds.includes(chainId)) && (!t.chainId || t.chainId === chainId));
      if (useTokens.length === 0) {
        updateBalances([]);
      }
      tokenTracker.current = new TokenTracker({
        userAddress: address,
        provider: global.ethereumProvider,
        includeFailedTokens: true, // prevent token tracker from quitting if balanceOf call reverts (can happen if contract with same address on multiple chains but one has balanceOf function and the other does not)
        tokens: useTokens,
        pollingInterval: 15000,
      });

      tokenTracker.current.on('update', updateBalances);
      tokenTracker.current.on('error', showError);
      tokenTracker.current.updateBalances();
    },
    [updateBalances, showError, teardownTracker],
  );

  // Effect to remove the tracker when the component is removed from DOM
  // Do not overload this effect with additional dependencies. teardownTracker
  // is the only dependency here, which itself has no dependencies and will
  // never update. The lack of dependencies that change is what confirms
  // that this effect only runs on mount/unmount
  useEffect(() => {
    return teardownTracker;
  }, [teardownTracker]);

  // Effect to set loading state and initialize tracker when values change
  useEffect(() => {
    // This effect will only run initially and when:
    // 1. network is updated,
    // 2. userAddress is changed,
    // 3. token list is updated and not equal to previous list
    // in any of these scenarios, we should indicate to the user that their token
    // values are in the process of updating by setting loading state.
    setLoading(true);

    if (!userAddress || network === 'loading' || !global.ethereumProvider) {
      // If we do not have enough information to build a TokenTracker, we exit early
      // When the values above change, the effect will be restarted. We also teardown
      // tracker because inevitably this effect will run again momentarily.
      teardownTracker();
      return;
    }

    if (memoizedTokens.length === 0) {
      // sets loading state to false and token list to empty
      updateBalances([]);
    }

    buildTracker(userAddress, memoizedTokens, network);
  }, [
    userAddress,
    teardownTracker,
    network,
    memoizedTokens,
    updateBalances,
    buildTracker,
  ]);

  return { loading, tokensWithBalances, error };
}
