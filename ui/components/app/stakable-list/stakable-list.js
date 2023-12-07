import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import AssetListItem from '../asset-list-item';
import { getCurrentAccountStakes } from '../../../selectors';
import { conversionUtil } from '../../../helpers/utils/conversion-util';
import thetaTokens from '../../../../gtx/theta-tokens.json';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TFUEL_TOKEN_IMAGE_URL,
  THETA_TOKEN_IMAGE_URL,
} from '../../../../app/scripts/controllers/network/enums';

const StakableList = ({ onClickAsset }) => {
  const t = useI18nContext();
  const stakes = useSelector(getCurrentAccountStakes) || [];
  const sums = {};
  stakes.forEach((e) => {
    sums[e.symbol] =
      window.BigInt(e.amount) + window.BigInt(sums[e.symbol] || 0);
  });
  const amountsStaked = {};
  Object.keys(sums).forEach((k) => {
    amountsStaked[k] = conversionUtil(`0x${sums[k].toString(16)}`, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 4,
    });
  });

  return (
    <>
      <AssetListItem
        tokenSymbol="TFUEL"
        displayName={t('specifiedTokensStaked', ['TFUEL'])}
        onClick={() => onClickAsset('TFUEL')}
        data-testid="tfuel-stake-balance"
        primary={amountsStaked.TFUEL || '0'}
        tokenImage={TFUEL_TOKEN_IMAGE_URL}
        identiconBorder
        action=""
      />
      <AssetListItem
        tokenSymbol="THETA"
        displayName={t('specifiedTokensStaked', ['THETA'])}
        onClick={() => onClickAsset('THETA')}
        data-testid="theta-stake-balance"
        primary={amountsStaked.THETA || '0'}
        tokenImage={THETA_TOKEN_IMAGE_URL}
        identiconBorder
        action=""
      />
      {Object.values(thetaTokens)
        .filter((token) => token.staking)
        .map((token) => (
          <AssetListItem
            key={token.address}
            tokenSymbol={token.symbol}
            displayName={t('specifiedTokensStaked', [token.symbol])}
            onClick={() => onClickAsset(token.symbol)}
            data-testid={`${token.symbol}-stake-balance`}
            primary={amountsStaked[token.symbol] || '0'}
            tokenImage={`images/contract/${token.logo}`}
            identiconBorder
            action=""
          />
        ))}
    </>
  );
};

StakableList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default StakableList;
