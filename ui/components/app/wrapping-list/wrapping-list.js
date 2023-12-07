import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getCurrentAccountWithSendEtherInfo,
  getShouldShowFiat,
  getNativeCurrencyImage,
} from '../../../selectors';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { conversionUtil } from '../../../helpers/utils/conversion-util';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
  THETA_TOKEN_IMAGE_URL,
} from '../../../../app/scripts/controllers/network/enums';

const WrappingList = ({ onClickAsset }) => {
  const selectedAccount = useSelector((state) =>
    getCurrentAccountWithSendEtherInfo(state),
  );
  const selectedAccountBalance = selectedAccount.balance;
  const selectedAccountBalance2 = selectedAccount.balance2;
  const showFiat = useSelector(getShouldShowFiat);
  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(
    selectedAccountBalance,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
  );

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(selectedAccountBalance, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    });

  const balThetaStr = conversionUtil(selectedAccountBalance2, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    numberOfDecimals: 4,
  });

  const primaryTokenImage = useSelector(getNativeCurrencyImage);

  return (
    <>
      {false && (<AssetListItem
        tokenSymbol={TFUEL_SYMBOL}
        onClick={() => {
          onClickAsset(TFUEL_SYMBOL);
        }}
        data-testid="wrap-tfuel"
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        tokenImage={primaryTokenImage}
        identiconBorder
        isERC721={false}
        action="wrapSpecifiedTokens"
      />)}
      <AssetListItem
        tokenSymbol={THETA_SYMBOL}
        onClick={() => {
          onClickAsset(THETA_SYMBOL);
        }}
        data-testid="wrap-theta"
        primary={balThetaStr}
        tokenImage={THETA_TOKEN_IMAGE_URL}
        identiconBorder
        isERC721={false}
        action="wrapSpecifiedTokens"
      />
      <TokenList
        onTokenClick={(tokenAddress) => {
          onClickAsset(tokenAddress);
        }}
        showOnly="wrapped"
      />
    </>
  );
};

WrappingList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default WrappingList;
