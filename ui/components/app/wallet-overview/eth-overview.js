import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import Button from '../../ui/button';
import Identicon from '../../ui/identicon';
import { I18nContext } from '../../../contexts/i18n';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { THETA_SYMBOL } from '../../../../app/scripts/controllers/network/enums';
import {
  isBalanceCached,
  getSelectedAccount,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getNativeCurrency2Image,
} from '../../../selectors';
import PaperAirplane from '../../ui/icon/paper-airplane-icon';
import { updateSendAsset } from '../../../store/actions';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../shared/constants/transaction';
import WalletOverview from './wallet-overview';

const EthOverview = ({ className, assetName }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const history = useHistory();
  const balanceIsCached = useSelector(isBalanceCached);
  const showFiat = useSelector(getShouldShowFiat);
  const selectedAccount = useSelector(getSelectedAccount);
  const { balance, balance2 } = selectedAccount;
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const secondaryTokenImage = useSelector(getNativeCurrency2Image);

  return (
    <WalletOverview
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className="eth-overview__balance">
            <div className="eth-overview__primary-container">
              <UserPreferencedCurrencyDisplay
                className={classnames('eth-overview__primary-balance', {
                  'eth-overview__cached-balance': balanceIsCached,
                })}
                data-testid="eth-overview__primary-currency"
                value={assetName === THETA_SYMBOL ? balance2 : balance}
                isNative2={assetName === THETA_SYMBOL}
                type={PRIMARY}
                ethNumberOfDecimals={
                  history.location.pathname.indexOf('asset') === -1 ? 4 : 36
                }
                hideTitle
                suffix={assetName}
              />
              {balanceIsCached ? (
                <span className="eth-overview__cached-star">*</span>
              ) : null}
            </div>
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                className={classnames({
                  'eth-overview__cached-secondary-balance': balanceIsCached,
                  'eth-overview__secondary-balance': !balanceIsCached,
                })}
                data-testid="eth-overview__secondary-currency"
                value={assetName === THETA_SYMBOL ? balance2 : balance}
                isNative2={assetName === THETA_SYMBOL}
                type={SECONDARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
            )}
          </div>
        </Tooltip>
      }
      buttons={
        <>
          <Button
            type="secondary"
            className="eth-overview__button"
            rounded
            icon={<PaperAirplane color="#037DD6" size={20} />}
            onClick={() => {
              dispatch(
                updateSendAsset({
                  type:
                    assetName === THETA_SYMBOL
                      ? ASSET_TYPE.NATIVE2
                      : ASSET_TYPE.NATIVE,
                  mode: ASSET_MODE.SEND,
                  address: null,
                }),
              );
              history.push(SEND_ROUTE);
            }}
            data-testid="eth-overview-send"
          >
            {t('send')}
          </Button>
        </>
      }
      className={className}
      icon={
        <Identicon
          diameter={32}
          image={
            assetName === THETA_SYMBOL ? secondaryTokenImage : primaryTokenImage
          }
        />
      }
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
  assetName: PropTypes.string,
};

EthOverview.defaultProps = {
  className: undefined,
};

export default EthOverview;
