import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import getAccountLink from '../../../lib/account-link';
import TransactionList from '../../../components/app/transaction-list';
import {
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import StakeOverview from '../../../components/app/wallet-overview/stake-overview';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { getCurrentNetwork } from '../../../selectors';
import StakeAssetNavigation from './stake-asset-navigation';
import StakeAssetOptions from './stake-asset-options';
import Stakes from './stakes';

export default function TokenStakeAsset({ token }) {
  const network = useSelector(getCurrentNetwork);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const { name: selectedAccountName, address: selectedAccountAddress } =
    useSelector(getSelectedIdentity);
  const history = useHistory();

  const accountLink = getAccountLink(selectedAccountAddress, network, rpcPrefs);

  const { tokensWithBalances } = useTokenTracker(token ? [token] : []);
  const assetBalance = tokensWithBalances[0]?.string ?? '0x0';

  return (
    <>
      <StakeAssetNavigation
        accountName={selectedAccountName}
        assetName={token.symbol}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <StakeAssetOptions
            onRemove={() => undefined}
            onClickBlockExplorer={() => {
              global.platform.openTab({ url: accountLink });
            }}
            tokenSymbol={token.symbol}
            tokenAddress={token.address}
          />
        }
      />
      <StakeOverview
        className="asset__overview"
        assetName={token.symbol}
        token={token}
        assetBalance={assetBalance}
      />
      <Stakes assetName={token.symbol} />
      <TransactionList
        showHeader
        tokenAddress={token.staking?.stakingAddress}
        showPurposes={null}
      />
    </>
  );
}

TokenStakeAsset.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symbol: PropTypes.string,
    isERC721: PropTypes.bool,
    staking: PropTypes.object,
  }).isRequired,
};
