import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import AddTokenButton from '../add-token-button';
import TokenList from '../token-list';
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getCurrentAccountWithSendEtherInfo,
  getNativeCurrency,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getSelectedNative,
} from '../../../selectors';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { conversionUtil } from '../../../helpers/utils/conversion-util';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
  THETA_TOKEN_IMAGE_URL,
} from '../../../../app/scripts/controllers/network/enums';

const AssetList = ({ onClickAsset }) => {
  const history = useHistory();
  const selectedAccount = useSelector(getCurrentAccountWithSendEtherInfo);
  const selectedAccountBalance = selectedAccount.balance;
  const selectedAccountBalance2 = selectedAccount.balance2;
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const selectedNative = useSelector(getSelectedNative);

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
    { numberOfDecimals: primaryNumberOfDecimals, currency: primaryCurrency },
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
      {nativeCurrency === TFUEL_SYMBOL && selectedNative && (
        <AssetListItem
          onClick={() => onClickAsset(THETA_SYMBOL)}
          data-testid="theta-balance"
          primary={balThetaStr}
          tokenSymbol={THETA_SYMBOL}
          tokenImage={THETA_TOKEN_IMAGE_URL}
          isERC721={false}
        />
      )}
      <AssetListItem
        tokenSymbol={primaryCurrencyProperties.suffix}
        tokenImage={primaryTokenImage}
        onClick={() => onClickAsset(nativeCurrency)}
        data-testid="wallet-balance"
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        isERC721={false}
      />
      {!(nativeCurrency === TFUEL_SYMBOL && selectedNative) && (
        <>
          <TokenList
            onTokenClick={(tokenAddress) => {
              onClickAsset(tokenAddress);
            }}
            showNFTs={false}
          />
          <AddTokenButton
            onClick={() => {
              history.push(ADD_TOKEN_ROUTE);
            }}
          />
        </>
      )}
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default AssetList;
