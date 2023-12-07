import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { createTokenTrackerLinkForChain } from '@metamask/etherscan-link';
import { THETAMAINNET_EXPLORER_URL } from '../../../../app/scripts/controllers/network/enums';
import TransactionList from '../../../components/app/transaction-list';
import { TokenOverview } from '../../../components/app/wallet-overview';
import {
  getCurrentChainId,
  getSelectedIdentity,
  getSelectedNFT,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { setSelectedNFT, showModal } from '../../../store/actions';
import { isEthNetwork, isThetaNetwork } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Tab, Tabs } from '../../../components/ui/tabs';
import NFTInventory from '../../../components/app/nft-inventory';
import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function TokenAsset({ token }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const useIsThetaNetwork = isThetaNetwork(chainId);
  const useIsEthNetwork = isEthNetwork(chainId);
  const selectedNft = useSelector(getSelectedNFT);
  const { name: selectedAccountName, address: selectedAccountAddress } =
    useSelector(getSelectedIdentity);
  const history = useHistory();
  const tokenTrackerLink = useIsThetaNetwork
    ? `${THETAMAINNET_EXPLORER_URL}/account/${token.address}`
    : createTokenTrackerLinkForChain(
        token.address,
        chainId,
        selectedAccountAddress,
      );
  const thetascanTrackerLink = token.isERC721
    ? `https://www.thetascan.io/tokens/721/contracts/?data=${token.address}`
    : `https://www.thetascan.io/address/tokens/?contract=${token.address}&address=${selectedAccountAddress}`;

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={token.symbol}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            onRemove={() =>
              dispatch(showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
            }
            isEthNetwork={useIsEthNetwork}
            isThetaNetwork={useIsThetaNetwork}
            onClickBlockExplorer={() => {
              global.platform.openTab({ url: tokenTrackerLink });
            }}
            onClickThetaScan={() => {
              global.platform.openTab({ url: thetascanTrackerLink });
            }}
            tokenSymbol={token.symbol}
            tokenAddress={token.address}
          />
        }
      />
      <TokenOverview
        className="asset__overview"
        token={token}
        nftSelected={selectedNft}
      />
      {token.isERC721 ? (
        <Tabs
          defaultActiveTabName="nft__tab"
          onTabClick={null}
          tabsClassName="nft_tabs"
        >
          <Tab
            activeClassName="nft__tab--active"
            className="nft__tab"
            data-testid="nft__inventory-tab"
            name={t('inventory')}
          >
            <NFTInventory
              onClickNFT={(nft) => dispatch(setSelectedNFT(nft))}
              className="nft__inventory"
              token={token}
            />
          </Tab>
          <Tab
            activeClassName="nft__tab--active"
            className="nft__tab"
            data-testid="nft__inventory-tab"
            name={t('activity')}
          >
            <TransactionList tokenAddress={token.address} />
          </Tab>
        </Tabs>
      ) : (
        <TransactionList tokenAddress={token.address} />
      )}
    </>
  );
}

TokenAsset.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symbol: PropTypes.string,
    isERC721: PropTypes.bool,
  }).isRequired,
};
