import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Identicon from '../../ui/identicon';
import ListItem from '../../ui/list-item';
import Tooltip from '../../ui/tooltip';
import InfoIcon from '../../ui/icon/info-icon.component';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { updateSendAsset } from '../../../store/actions';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  ASSET_TYPE,
  ASSET_MODE,
} from '../../../../shared/constants/transaction';

const NFTListItem = ({
  className,
  'data-testid': dataTestId,
  iconClassName,
  onClick,
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  tokenImage,
  warning,
  primary,
  secondary,
  identiconBorder,
  isERC721,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const titleIcon = warning ? (
    <Tooltip
      wrapperClassName="nft-list-item__warning-tooltip"
      interactive
      position="bottom"
      html={warning}
    >
      <InfoIcon severity="warning" />
    </Tooltip>
  ) : null;

  const midContent = warning ? (
    <>
      <InfoIcon severity="warning" />
      <div className="nft-list-item__warning">{warning}</div>
    </>
  ) : null;

  const sendAssetButton = useMemo(() => {
    if (tokenAddress === null || tokenAddress === undefined) {
      return null;
    }
    return (
      <Button
        type="link"
        className="nft-list-item__send-token-button"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(
            updateSendAsset({
              type: ASSET_TYPE.NFT,
              address: tokenAddress,
              decimals: tokenDecimals,
              symbol: tokenSymbol,
              mode: ASSET_MODE.SEND,
            }),
          ).then(() => {
            history.push(SEND_ROUTE);
          });
        }}
      >
        {t('sendSpecifiedTokens', [tokenSymbol])}
      </Button>
    );
  }, [tokenSymbol, tokenAddress, tokenDecimals, history, t, dispatch]);

  return (
    <ListItem
      className={classnames('nft-list-item', className)}
      data-testid={dataTestId}
      title={
        <button
          className="nft-list-item__token-button"
          onClick={onClick}
          title={`${primary} ${tokenSymbol}`}
        >
          <h2>
            <span className="nft-list-item__token-value">{primary}</span>
            <span className="nft-list-item__token-symbol">{tokenSymbol}</span>
          </h2>
        </button>
      }
      titleIcon={titleIcon}
      subtitle={secondary ? <h3 title={secondary}>{secondary}</h3> : null}
      onClick={onClick}
      icon={
        <Identicon
          className={iconClassName}
          diameter={32}
          address={tokenAddress}
          image={tokenImage}
          alt={`${primary} ${tokenSymbol}`}
          imageBorder={identiconBorder}
        />
      }
      midContent={midContent}
      rightContent={
        !isERC721 && (
          <>
            <i className="fas fa-chevron-right nft-list-item__chevron-right" />
            {sendAssetButton}
          </>
        )
      }
    />
  );
};

NFTListItem.propTypes = {
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
  tokenSymbol: PropTypes.string,
  tokenDecimals: PropTypes.number,
  tokenImage: PropTypes.string,
  warning: PropTypes.node,
  primary: PropTypes.string,
  secondary: PropTypes.string,
  identiconBorder: PropTypes.bool,
  isERC721: PropTypes.bool,
};

NFTListItem.defaultProps = {
  className: undefined,
  'data-testid': undefined,
  iconClassName: undefined,
  tokenAddress: undefined,
  tokenImage: undefined,
  warning: undefined,
};

export default NFTListItem;
