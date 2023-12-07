import React from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';

import { useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { getAssetImages } from '../../../selectors';
import { getTokens } from '../../../ducks/metamask/metamask';

export default function TokenList({ onTokenClick, showOnly }) {
  const t = useI18nContext();
  const assetImages = useSelector(getAssetImages);
  const tokens = useSelector(getTokens, isEqual);
  const { loading, error, tokensWithBalances } = useTokenTracker(tokens);

  let filteredTokensWithBalances, action;
  switch (showOnly) {
    case 'nfts': {
      filteredTokensWithBalances = tokensWithBalances.filter((e) => e.isERC721);
      action = 'sendSpecifiedTokens';
      break;
    }
    case 'wrapped':
      filteredTokensWithBalances = tokensWithBalances.filter(
        (e) => e.symbol === 'WTFUEL' || e.symbol === 'WTHETA',
      );
      action = 'unwrapSpecifiedTokens';
      break;
    case 'unwrapped':
      filteredTokensWithBalances = tokensWithBalances.filter(
        (e) => e.symbol === 'TFUEL' || e.symbol === 'THETA',
      );
      action = 'wrapSpecifiedTokens';
      break;
    default: {
      filteredTokensWithBalances = tokensWithBalances.filter(
        (e) => !e.isERC721,
      );
      action = 'sendSpecifiedTokens';
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '250px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
        }}
      >
        {t('loadingTokens')}
      </div>
    );
  }

  return (
    <div>
      {filteredTokensWithBalances.map((tokenData, index) => {
        tokenData.image = assetImages[tokenData.address];
        return (
          <TokenCell
            key={index}
            {...tokenData}
            outdatedBalance={Boolean(error)}
            onClick={onTokenClick}
            action={(!tokenData.unsendable && action) || undefined}
          />
        );
      })}
    </div>
  );
}

TokenList.propTypes = {
  onTokenClick: PropTypes.func.isRequired,
  showOnly: PropTypes.string,
};
TokenList.defaultProps = {
  showOnly: undefined,
};
