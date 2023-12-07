import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Button from '../../ui/button';
import Identicon from '../../ui/identicon';
import { I18nContext } from '../../../contexts/i18n';
import { WRAP_ROUTE } from '../../../helpers/constants/routes';
import {
  getAssetImages,
  getShouldShowFiat,
} from '../../../selectors/selectors';
import { updateSendAsset, updateSendTo } from '../../../store/actions';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../shared/constants/transaction';
import {
  getNativeCurrency2Image,
  getNativeCurrencyImage,
} from '../../../selectors';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../../app/scripts/controllers/network/enums';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import BoxIcon from '../../ui/icon/overview-box-icon.component';
import UnboxIcon from '../../ui/icon/overview-unbox-icon.component';
import * as theta from '../../../../shared/constants/theta';
import WalletOverview from './wallet-overview';

const WrapOverview = ({
  className,
  assetName,
  assetBalance,
  token,
  unwrapping,
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const history = useHistory();
  const showFiat = useSelector(getShouldShowFiat);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const secondaryTokenImage = useSelector(getNativeCurrency2Image);
  const assetImages = useSelector(getAssetImages);
  let assetType, assetAddress, assetImage;
  switch (assetName) {
    case TFUEL_SYMBOL:
      assetType = ASSET_TYPE.NATIVE;
      assetImage = primaryTokenImage;
      break;
    case THETA_SYMBOL:
      assetType = ASSET_TYPE.NATIVE2;
      assetImage = secondaryTokenImage;
      assetAddress = theta.contracts.WTHETA;
      break;
    case 'WTFUEL':
      assetType = ASSET_TYPE.TOKEN;
      assetAddress = theta.contracts.WTFUEL;
      assetImage = './images/contract/tfuel-wrapped.svg';
      break;
    case 'WTHETA':
      assetType = ASSET_TYPE.TOKEN;
      assetAddress = theta.contracts.WTHETA;
      assetImage = './images/contract/theta-wrapped.svg';
      break;
    default:
      assetType = ASSET_TYPE.TOKEN;
      assetAddress = token?.address;
      assetImage = assetImages[assetAddress];
  }

  const onClickWrapOrUnwrap = async () => {
    await Promise.all([
      dispatch(
        updateSendAsset({
          ...(token || { address: null }),
          type: assetType,
          mode: unwrapping ? ASSET_MODE.UNWRAP : ASSET_MODE.WRAP,
        }),
      ),
      dispatch(updateSendTo(assetAddress, assetName)),
    ]);
    history.push(`${WRAP_ROUTE}`);
  };

  return (
    <WalletOverview
      balance={
        <div className="wrap-overview__balance">
          <UserPreferencedCurrencyDisplay
            className="wrap-overview__primary-balance"
            data-testid="wrap-overview__primary-currency"
            value={
              assetBalance?.slice(0, 2) === '0x' ? assetBalance : undefined
            }
            displayValue={
              assetBalance?.slice(0, 2) === '0x' ? undefined : assetBalance
            }
            type={PRIMARY}
            ethNumberOfDecimals={36}
            hideTitle
            suffix={assetName}
          />
          {showFiat && (
            <UserPreferencedCurrencyDisplay
              className="wrap-overview__secondary-balance"
              data-testid="wrap-overview__secondary-currency"
              value={
                assetBalance?.slice(0, 2) === '0x' ? assetBalance : undefined
              }
              displayValue={
                assetBalance?.slice(0, 2) === '0x' ? undefined : assetBalance
              }
              type={SECONDARY}
              ethNumberOfDecimals={4}
              hideTitle
            />
          )}
        </div>
      }
      buttons={
        <Button
          type="secondary"
          className="wrap-overview__button"
          rounded
          icon={unwrapping ? UnboxIcon() : BoxIcon()}
          onClick={onClickWrapOrUnwrap}
        >
          {t(unwrapping ? 'unwrap' : 'wrap')}
        </Button>
      }
      className={className}
      icon={<Identicon diameter={32} image={assetImage} />}
    />
  );
};

WrapOverview.propTypes = {
  assetName: PropTypes.string.isRequired,
  assetBalance: PropTypes.string.isRequired,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symbol: PropTypes.string,
    isERC721: PropTypes.bool,
  }),
  unwrapping: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

WrapOverview.defaultProps = {
  className: undefined,
};

export default WrapOverview;
