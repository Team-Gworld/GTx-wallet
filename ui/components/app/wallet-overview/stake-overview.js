import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Button from '../../ui/button';
import Identicon from '../../ui/identicon';
import { I18nContext } from '../../../contexts/i18n';
import { STAKE_ROUTE } from '../../../helpers/constants/routes';
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
import { PRIMARY } from '../../../helpers/constants/common';
import PlusIcon from '../../ui/icon/overview-plus-icon.component';
import CurrencyDisplay from '../../ui/currency-display';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import WalletOverview from './wallet-overview';

const StakeOverview = ({ className, assetName, assetBalance, token }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const history = useHistory();
  const showFiat = useSelector(getShouldShowFiat);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const secondaryTokenImage = useSelector(getNativeCurrency2Image);
  const assetImages = useSelector(getAssetImages);

  const formattedFiatBalance = useTokenFiatAmount(
    token?.address,
    assetBalance,
    token?.symbol,
  );

  let assetType, assetAddress, assetImage;
  switch (assetName) {
    case TFUEL_SYMBOL:
      assetType = ASSET_TYPE.NATIVE;
      assetImage = primaryTokenImage;
      break;
    case THETA_SYMBOL:
      assetType = ASSET_TYPE.NATIVE2;
      assetImage = secondaryTokenImage;
      break;
    default:
      assetType = ASSET_TYPE.TOKEN;
      assetAddress = token?.address;
      assetImage = assetImages[assetAddress];
  }

  const onClickAddStake = async () => {
    await Promise.all([
      dispatch(
        updateSendAsset({
          ...(token || { address: null }),
          type: assetType,
          mode: ASSET_MODE.STAKE,
        }),
      ),
      dispatch(updateSendTo(assetAddress, assetName)),
    ]);
    history.push(`${STAKE_ROUTE}`);
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
          {showFiat && formattedFiatBalance && (
            <CurrencyDisplay
              className="wrap-overview__secondary-balance"
              displayValue={formattedFiatBalance}
              hideLabel
            />
          )}
        </div>
      }
      buttons={
        <Button
          type="secondary"
          className="wrap-overview__button"
          rounded
          icon={PlusIcon()}
          onClick={onClickAddStake}
        >
          {t('addStake')}
        </Button>
      }
      className={className}
      icon={<Identicon diameter={32} image={assetImage} />}
    />
  );
};

StakeOverview.propTypes = {
  assetName: PropTypes.string.isRequired,
  assetBalance: PropTypes.string.isRequired,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symbol: PropTypes.string,
    isERC721: PropTypes.bool,
  }),
  className: PropTypes.string,
};

StakeOverview.defaultProps = {
  className: undefined,
};

export default StakeOverview;
