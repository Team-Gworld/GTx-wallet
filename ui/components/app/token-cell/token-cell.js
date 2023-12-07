import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import AssetListItem from '../asset-list-item';
import { getCurrentChainId, getSelectedAddress } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import gtxTokens from '../../../../gtx/gtx-tokens.json';

const lcGtxTokens = Object.fromEntries(
  Object.entries(gtxTokens).map(([k, v]) => [k.toLowerCase(), v]),
);

export default function TokenCell({
  address,
  decimals,
  outdatedBalance,
  symbol,
  string,
  image,
  onClick,
  isERC721,
  unsendable,
  action,
}) {
  const userAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const t = useI18nContext();

  const formattedFiat = useTokenFiatAmount(address, string, symbol);

  const warning = outdatedBalance ? (
    <span>
      {t('troubleTokenBalances')}
      <a
        href={`https://ethplorer.io/address/${userAddress}`}
        rel="noopener noreferrer"
        target="_blank"
        style={{ color: '#F7861C' }}
      >
        {t('here')}
      </a>
    </span>
  ) : null;

  const gtxToken = lcGtxTokens[address];
  const nameOverride =
    !gtxToken || gtxToken.chainId !== chainId ? null : gtxToken.name;

  return (
    <AssetListItem
      className={classnames('token-cell', {
        'token-cell--outdated': outdatedBalance,
      })}
      iconClassName="token-cell__icon"
      onClick={onClick.bind(null, address)}
      tokenAddress={address}
      tokenImage={image}
      tokenSymbol={symbol}
      tokenDecimals={decimals}
      displayName={nameOverride ?? symbol}
      warning={warning}
      primary={`${string || 0} ${symbol}`}
      secondary={formattedFiat}
      isERC721={isERC721}
      unsendable={unsendable}
      action={action}
    />
  );
}

TokenCell.propTypes = {
  address: PropTypes.string,
  outdatedBalance: PropTypes.bool,
  symbol: PropTypes.string,
  decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  string: PropTypes.string,
  image: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  isERC721: PropTypes.bool,
  usendable: PropTypes.bool,
  action: PropTypes.string,
};

TokenCell.defaultProps = {
  outdatedBalance: false,
};
