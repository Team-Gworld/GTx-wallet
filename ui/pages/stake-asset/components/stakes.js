import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  getCurrentAccountStakes,
  getNativeCurrency2Image,
  getNativeCurrencyImage,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { conversionUtil } from '../../../helpers/utils/conversion-util';
import { shortenAddress } from '../../../helpers/utils/util';
import { formatNumber } from '../../../helpers/utils/formatters';
import AssetListItem from '../../../components/app/asset-list-item/asset-list-item';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../../app/scripts/controllers/network/enums';

export default function Stakes({ assetName }) {
  const t = useI18nContext();
  const stakes = useSelector(getCurrentAccountStakes) || [];
  const filteredStakes = stakes.filter((e) => e.symbol === assetName);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const secondaryTokenImage = useSelector(getNativeCurrency2Image);

  return (
    <div className="transaction-list stakes">
      <h2>{t('stakes')}</h2>
      {filteredStakes.length > 0 ? (
        filteredStakes.map((e, index) => {
          const amountInDec = conversionUtil(e.amount, {
            fromNumericBase: 'hex',
            toNumericBase: 'dec',
            fromDenomination: 'WEI',
            numberOfDecimals: 4,
          });
          const sharesInDec = e.stakedShares
            ? conversionUtil(e.stakedShares, {
                fromNumericBase: 'hex',
                toNumericBase: 'dec',
                fromDenomination: 'WEI',
                numberOfDecimals: 4,
              })
            : undefined;
          let tokenImage;
          switch (e.symbol) {
            case TFUEL_SYMBOL:
              tokenImage = primaryTokenImage;
              break;
            case THETA_SYMBOL:
              tokenImage = secondaryTokenImage;
              break;
            default:
              if (e.token?.logo) {
                tokenImage = e.token.logo.includes('://')
                  ? e.token.logo
                  : `images/contract/${e.token.logo}`;
              }
          }
          let secondary;
          switch (e.type?.slice(0, 3)) {
            case 'gcp':
              secondary = t('toGuardian', [shortenAddress(e.holder)]);
              break;
            case 'vcp':
              secondary = t('toValidator', [shortenAddress(e.holder)]);
              break;
            case 'een':
              secondary = t('toEen', [shortenAddress(e.holder)]);
              break;
            default:
              secondary = e.stakedShares
                ? `${amountInDec} ${e.symbol}`
                : undefined;
          }
          const tertiary = e.withdrawn
            ? t('unlockAtBlock', [formatNumber(e.return_height)])
            : undefined;
          const { address: tokenAddress, decimals: tokenDecimals } =
            e.token || {};

          return (
            <AssetListItem
              key={index}
              stake={e}
              tokenSymbol={assetName}
              tokenAddress={tokenAddress?.toLowerCase()}
              tokenDecimals={tokenDecimals}
              onClick={() => {
                return undefined;
              }}
              data-testid="stakes"
              tokenImage={tokenImage}
              identiconBorder
              action="unstake"
              primary={e.stakedShares ? sharesInDec : amountInDec}
              displayName={
                e.stakedShares ? e.token.staking?.stakeSymbol : undefined
              }
              secondary={secondary}
              tertiary={tertiary}
            />
          );
        })
      ) : (
        <div className="transaction-list__empty-text">{t('noStakes')}</div>
      )}
    </div>
  );
}

Stakes.propTypes = {
  assetName: PropTypes.string.isRequired,
};
