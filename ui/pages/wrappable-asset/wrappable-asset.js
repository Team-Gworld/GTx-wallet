import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import getAccountLink from '../../lib/account-link';
import TransactionList from '../../components/app/transaction-list';
import { WrapOverview } from '../../components/app/wallet-overview';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getRpcPrefsForCurrentProvider,
  getSelectedAccount,
  getSelectedNative,
  getCurrentChainId,
  getSelectedIdentity,
} from '../../selectors';
import {
  TFUEL_SYMBOL,
  THETAMAINNET_CHAIN_ID,
  THETA_SYMBOL,
} from '../../../app/scripts/controllers/network/enums';
import { getTokens } from '../../ducks/metamask/metamask';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import { contracts } from '../../../shared/constants/theta';
import WrappableAssetNavigation from './components/wrappable-asset-navigation';
import WrappableAssetOptions from './components/wrappable-asset-options';

export default function WrappableAsset() {
  const nativeSelected = useSelector(getSelectedNative);
  const chainId = useSelector(getCurrentChainId);
  const onRightNetwork = chainId === THETAMAINNET_CHAIN_ID && nativeSelected;
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const { name: selectedAccountName, address: selectedAccountAddress } =
    useSelector(getSelectedIdentity);
  const history = useHistory();
  const accountLink = getAccountLink(selectedAccountAddress, chainId, rpcPrefs);
  const tokens = useSelector(getTokens);
  const { asset } = useParams();

  const token = tokens.find(({ address }) => address === asset);
  let assetBalance;
  {
    const { tokensWithBalances } = useTokenTracker(token ? [token] : []);
    const selectedAccount = useSelector(getSelectedAccount);
    if (token) {
      assetBalance = tokensWithBalances[0]?.string ?? '';
    } else {
      const { balance, balance2 } = selectedAccount;
      assetBalance = (asset === THETA_SYMBOL ? balance2 : balance) ?? '';
    }
  }

  let wrapperContract, unwrapping;
  switch (asset) {
    case TFUEL_SYMBOL:
      unwrapping = false;
      wrapperContract = contracts.WTFUEL;
      break;
    case 'WTFUEL':
    case contracts.WTFUEL:
      unwrapping = true;
      wrapperContract = contracts.WTFUEL;
      break;
    case 'THETA':
      unwrapping = false;
      wrapperContract = contracts.WTHETA;
      break;
    case 'WTHETA':
    case contracts.WTHETA:
      unwrapping = true;
      wrapperContract = contracts.WTHETA;
      break;
    default:
      throw new Error('invalid asset for wrap/unwrap asset page');
  }
  const assetName = token ? token.symbol : asset;

  let content;
  if (onRightNetwork) {
    content = (
      <>
        <WrappableAssetNavigation
          accountName={selectedAccountName}
          assetName={assetName}
          unwrapping={unwrapping}
          onBack={() => history.push(DEFAULT_ROUTE)}
          optionsButton={
            <WrappableAssetOptions
              onRemove={() => undefined}
              onClickBlockExplorer={() => {
                global.platform.openTab({ url: accountLink });
              }}
            />
          }
        />
        <WrapOverview
          className="asset__overview"
          assetName={assetName}
          assetBalance={assetBalance}
          unwrapping={unwrapping}
          token={token}
        />
        <TransactionList tokenAddress={wrapperContract} />
      </>
    );
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return (
    <div className="main-container wrappable-asset__container">{content}</div>
  );
}
