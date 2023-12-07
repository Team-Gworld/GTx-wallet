import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Identicon from '../../ui/identicon';
import ListItem from '../../ui/list-item';
import Tooltip from '../../ui/tooltip';
import InfoIcon from '../../ui/icon/info-icon.component';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { signTx, updateSendAsset, updateSendTo } from '../../../store/actions';
import { formatNumber } from '../../../helpers/utils/formatters';
import {
  ASSET_TYPE,
  ASSET_MODE,
} from '../../../../shared/constants/transaction';
import {
  SEND_ROUTE,
  STAKE_ROUTE,
  WRAP_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../../helpers/constants/routes';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../../app/scripts/controllers/network/enums';
import * as theta from '../../../../shared/constants/theta';
import MinusIcon from '../../ui/icon/overview-minus-icon.component';
import { getTokens } from '../../../ducks/metamask/metamask';
import {
  getGasLimit,
  getGasPriceParams,
  getSelectedAddress,
} from '../../../selectors';
import { constructTxParams } from '../../../pages/stake/stake-footer/stake-footer.utils';

const AssetListItem = ({
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
  displayName,
  secondary,
  tertiary,
  isERC721,
  unsendable,
  stake,
  action,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const tokens = useSelector(getTokens);

  const gasPriceParams = useSelector(getGasPriceParams);
  const gas = useSelector(getGasLimit);
  const from = useSelector(getSelectedAddress);

  const titleIcon = warning ? (
    <Tooltip
      wrapperClassName="asset-list-item__warning-tooltip"
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
      <div className="asset-list-item__warning">{warning}</div>
    </>
  ) : null;

  const sendAssetButton = useMemo(() => {
    if (
      (tokenAddress === null || tokenAddress === undefined) &&
      tokenSymbol !== THETA_SYMBOL &&
      tokenSymbol !== TFUEL_SYMBOL // TODO: block adding symbols that match these
    ) {
      return null;
    }
    const isTheta =
      (tokenAddress === null || tokenAddress === undefined) &&
      tokenSymbol === THETA_SYMBOL;
    const onLinkClick = async (e) => {
      e.stopPropagation();
      let type, token, mode, route;
      if (action === 'wrapSpecifiedTokens') {
        mode = ASSET_MODE.WRAP;
        let address, nickname;
        if (isTheta) {
          type = ASSET_TYPE.NATIVE2;
          nickname = 'WTHETA';
          address = theta.contracts.WTHETA;
        } else {
          type = ASSET_TYPE.NATIVE;
          nickname = 'WTFUEL';
          address = theta.contracts.WTFUEL;
        }
        await Promise.all([
          dispatch(updateSendTo(address, nickname)),
          dispatch(updateSendAsset({ address: null, type, mode })),
        ]);
        route = `${WRAP_ROUTE}`;
      } else if (action === 'unwrapSpecifiedTokens') {
        mode = ASSET_MODE.UNWRAP;
        type = ASSET_TYPE.TOKEN;
        token = {
          address: tokenAddress || null,
          decimals: tokenDecimals || 18,
          symbol: tokenSymbol || null,
        };
        let address, nickname;
        if (tokenSymbol === 'WTHETA') {
          nickname = 'WTHETA';
          address = theta.contracts.WTHETA;
        } else if (tokenSymbol === 'WTFUEL') {
          nickname = 'WTFUEL';
          address = theta.contracts.WTFUEL;
        }
        await Promise.all([
          dispatch(updateSendTo(address, nickname)),
          dispatch(updateSendAsset({ ...token, type, mode })),
        ]);
        route = `${WRAP_ROUTE}`;
      } else {
        mode = action === 'unstake' ? ASSET_MODE.UNSTAKE : ASSET_MODE.SEND;
        if (tokenAddress) {
          type = ASSET_TYPE.TOKEN;
        } else {
          type = isTheta ? ASSET_TYPE.NATIVE2 : ASSET_TYPE.NATIVE;
        }
        token = tokenAddress
          ? {
              address: tokenAddress,
              decimals: tokenDecimals || 18,
              symbol: tokenSymbol,
            }
          : undefined;
        if (action === 'unstake') {
          if (type === ASSET_TYPE.TOKEN) {
            token = tokens.find(
              (tkn) => tkn.stakedAsset?.address?.toLowerCase() === tokenAddress,
            );
            const stakedToken = tokens.find(
              (tkn) => tkn.address.toLowerCase() === tokenAddress.toLowerCase(),
            );
            if (token) {
              token.stakedToken = stakedToken;
            } else {
              token = stakedToken;
            }
            await Promise.all([
              dispatch(updateSendAsset({ ...token, type, mode, stake })),
              dispatch(
                updateSendTo(
                  token?.address || tokenAddress,
                  token?.symbol || tokenSymbol,
                ),
              ),
            ]);
            route = STAKE_ROUTE;
          } else {
            const address = stake?.holder ?? stake?.holderSummary?.slice(0, 42);
            const nickname =
              type === ASSET_TYPE.NATIVE2 ? THETA_SYMBOL : TFUEL_SYMBOL;
            const sendAsset = {
              ...(token || { address: null }),
              type,
              mode,
              stake,
            };
            await Promise.all([
              dispatch(updateSendAsset(sendAsset)),
              dispatch(updateSendTo(address, nickname)),
            ]);

            const txParams = constructTxParams({
              sendAsset,
              from,
              amount: stake.amount,
              gas,
              ...gasPriceParams,
            });
            await dispatch(signTx(txParams));
            route = CONFIRM_TRANSACTION_ROUTE;
          }
        } else {
          await dispatch(
            updateSendAsset({
              ...(token || { address: null }),
              type,
              mode,
            }),
          );
          route = SEND_ROUTE;
        }
      }
      history.push(route);
    };

    let actionButton;
    if (action === '') {
      actionButton = <></>;
    } else {
      actionButton = stake ? (
        <button
          className={classnames('icon-button', 'wrap-overview__button', {
            'icon-button--disabled': stake.withdrawn,
          })}
          data-testid="wrap-overview-wrap"
          onClick={onLinkClick}
        >
          <div className="icon-button__circle">
            {MinusIcon({ fill: '#037dd6', stroke: 'white' })}
          </div>
          <span>{stake.withdrawn ? t('inCooldown') : t('removeStake')}</span>
        </button>
      ) : (
        <Button
          type="link"
          className="asset-list-item__send-token-button"
          onClick={onLinkClick}
        >
          {isERC721 || unsendable ? '' : t(action, [tokenSymbol ?? ''])}
        </Button>
      );
    }
    return actionButton;
  }, [tokenSymbol, tokenAddress, tokenDecimals, history, t, dispatch, stake]);

  const fprim = formatNumber(primary?.replace(` ${tokenSymbol}`, ''));
  const title = `${fprim} ${displayName || tokenSymbol}`;
  return (
    <ListItem
      className={classnames('asset-list-item', className)}
      data-testid={dataTestId}
      title={title}
      titleIcon={titleIcon}
      subtitle={
        secondary && (
          <h3 title={secondary}>
            {secondary}
            {tertiary && (
              <>
                <br />
                {tertiary}
              </>
            )}
          </h3>
        )
      }
      onClick={onClick}
      icon={
        <Identicon
          className={iconClassName}
          diameter={32}
          address={tokenAddress}
          image={tokenImage}
        />
      }
      midContent={midContent}
      rightContent={
        <>
          {!stake && (
            <i className="fas fa-chevron-right asset-list-item__chevron-right" />
          )}
          {sendAssetButton}
        </>
      }
    />
  );
};

AssetListItem.propTypes = {
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
  tokenSymbol: PropTypes.string,
  tokenDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tokenImage: PropTypes.string,
  displayName: PropTypes.string,
  warning: PropTypes.node,
  primary: PropTypes.string,
  secondary: PropTypes.string,
  tertiary: PropTypes.string,
  isERC721: PropTypes.bool,
  unsendable: PropTypes.bool,
  stake: PropTypes.object,
  action: PropTypes.string,
};

AssetListItem.defaultProps = {
  className: undefined,
  'data-testid': undefined,
  iconClassName: undefined,
  stake: undefined,
  tokenAddress: undefined,
  tokenImage: undefined,
  warning: undefined,
  isERC721: false,
  unsendable: false,
  action: 'sendSpecifiedTokens',
};

export default AssetListItem;
