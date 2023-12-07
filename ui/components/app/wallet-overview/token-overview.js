import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import gtxTokens from '../../../../gtx/gtx-tokens.json';
import Button from '../../ui/button';
import Identicon from '../../ui/identicon';
import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import {
  getAssetImages,
  getCurrentChainId,
} from '../../../selectors/selectors';
import { updateSendAmount, updateSendAsset } from '../../../store/actions';
import {
  ASSET_TYPE,
  ASSET_MODE,
} from '../../../../shared/constants/transaction';
import PaperAirplane from '../../ui/icon/paper-airplane-icon';
import WalletOverview from './wallet-overview';

const lcGtxTokens = Object.fromEntries(
  Object.entries(gtxTokens).map(([k, v]) => [k.toLowerCase(), v]),
);

const TokenOverview = ({ className, token, nftSelected }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const history = useHistory();
  const assetImages = useSelector(getAssetImages);
  const chainId = useSelector(getCurrentChainId);
  const { tokensWithBalances } = useTokenTracker([token]);
  const balance = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token?.address,
    balance,
    token?.symbol,
  );

  const gtxToken = lcGtxTokens[token?.address];
  const nameOverride =
    !gtxToken || gtxToken.chainId !== chainId ? null : gtxToken.name;
  const isSelectedNFT =
    nftSelected && token?.address === nftSelected.tokenAddress;

  return (
    <WalletOverview
      balance={
        isSelectedNFT ? (
          <div className="nft-overview">
            <div className="token-id">#{nftSelected.tokenID}</div>
            <div className="nft-name">{nftSelected.name}</div>
          </div>
        ) : (
          <div className="token-overview__balance">
            <CurrencyDisplay
              className="token-overview__primary-balance"
              displayValue={balance}
              suffix={
                token?.isERC721 && nameOverride ? nameOverride : token?.symbol
              }
              numberOfDecimals={36}
            />
            {formattedFiatBalance ? (
              <CurrencyDisplay
                className="token-overview__secondary-balance"
                displayValue={formattedFiatBalance}
                hideLabel
              />
            ) : null}
          </div>
        )
      }
      buttons={
        <Button
          type="secondary"
          className="token-overview__button"
          rounded
          icon={<PaperAirplane color="#037DD6" size={20} />}
          onClick={() => {
            const nft = isSelectedNFT && {
              ...nftSelected,
              symbol: nftSelected.name,
              address: token?.address,
              decimals: 0,
            };
            dispatch(
              updateSendAsset({
                ...(nft || token || { address: null }),
                type: isSelectedNFT ? ASSET_TYPE.NFT : ASSET_TYPE.TOKEN,
                mode: ASSET_MODE.SEND,
              }),
            );
            if (isSelectedNFT) {
              dispatch(updateSendAmount('0x1'));
            }
            history.push(SEND_ROUTE);
          }}
          disabled={token?.unsendable || (token?.isERC721 && !isSelectedNFT)}
        >
          {t('send')}
        </Button>
      }
      className={className}
      icon={
        isSelectedNFT ? (
          <img
            className="nft-image"
            src={nftSelected.image || assetImages[token?.address]}
          />
        ) : (
          <Identicon
            diameter={32}
            address={token?.address}
            image={assetImages[token?.address]}
          />
        )
      }
    />
  );
};

TokenOverview.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symbol: PropTypes.string,
    isERC721: PropTypes.bool,
  }).isRequired,
  nftSelected: PropTypes.object,
};

TokenOverview.defaultProps = {
  className: undefined,
  nftSelected: undefined,
};

export default TokenOverview;
