import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmTransactionBase from '../confirm-transaction-base';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import {
  formatCurrency,
  convertTokenToFiat,
  addFiat,
  roundExponential,
} from '../../helpers/utils/confirm-tx.util';
import { getWeiHexFromDecimalValue } from '../../helpers/utils/conversions.util';
import { ETH, PRIMARY } from '../../helpers/constants/common';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../app/scripts/controllers/network/enums';

export default class ConfirmStakeUnstakeTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    tokenAddress: PropTypes.string,
    toAddress: PropTypes.string,
    tokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    stakeToken: PropTypes.object,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    contractExchangeRate: PropTypes.number,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    nativeCurrencyImage: PropTypes.string,
    nativeCurrency: PropTypes.string,
    onEdit: PropTypes.func,
    action: PropTypes.string,
  };

  static defaultProps = {
    tokenAmount: '0',
  };

  getFiatTransactionAmount() {
    const {
      tokenAmount,
      currentCurrency,
      conversionRate,
      contractExchangeRate,
    } = this.props;

    return convertTokenToFiat({
      value: tokenAmount,
      toCurrency: currentCurrency,
      conversionRate,
      contractExchangeRate,
    });
  }

  renderSubtitleComponent() {
    const { contractExchangeRate, tokenAmount } = this.props;

    const decimalEthValue = tokenAmount * contractExchangeRate || 0;
    const hexWeiValue = getWeiHexFromDecimalValue({
      value: decimalEthValue,
      fromCurrency: ETH,
      fromDenomination: ETH,
    });

    return typeof contractExchangeRate === 'undefined' ||
      contractExchangeRate === 0 ? (
      <span>{/* this.context.t('noConversionRateAvailable') */}</span>
    ) : (
      <UserPreferencedCurrencyDisplay
        value={hexWeiValue}
        type={PRIMARY}
        showEthLogo
        hideLabel
      />
    );
  }

  renderPrimaryTotalTextOverride() {
    const {
      tokenAmount,
      tokenSymbol,
      ethTransactionTotal,
      nativeCurrencyImage,
      nativeCurrency,
    } = this.props;
    const tokensText = `${tokenAmount} ${tokenSymbol}`;

    return (
      <div>
        <span>{`${tokensText} + `}</span>
        {nativeCurrencyImage && <img src={nativeCurrencyImage} height="18" />}
        <span>{ethTransactionTotal}</span>
        {!nativeCurrencyImage && nativeCurrency}
      </div>
    );
  }

  getSecondaryTotalTextOverride() {
    const { fiatTransactionTotal, currentCurrency, contractExchangeRate } =
      this.props;

    if (
      typeof contractExchangeRate === 'undefined' ||
      contractExchangeRate === 0
    ) {
      return this.context.t('noConversionRateAvailable');
    }
    const fiatTransactionAmount = this.getFiatTransactionAmount();
    const fiatTotal = addFiat(fiatTransactionAmount, fiatTransactionTotal);
    const roundedFiatTotal = roundExponential(fiatTotal);
    return formatCurrency(roundedFiatTotal, currentCurrency);
  }

  render() {
    const { t } = this.context;
    const {
      toAddress,
      tokenAddress,
      tokenSymbol,
      stakeToken,
      tokenAmount,
      ethTransactionTotal,
      nativeCurrency,
      onEdit,
      action,
      ...restProps
    } = this.props;

    const unstakeTFuelOrTheta =
      action === 'unstake' &&
      (tokenSymbol === TFUEL_SYMBOL || tokenSymbol === THETA_SYMBOL);
    const useTokenSymbol =
      action === 'unstake' && stakeToken ? stakeToken.symbol : tokenSymbol;
    const tokensText = unstakeTFuelOrTheta
      ? t('allOfToken', [useTokenSymbol])
      : `${tokenAmount} ${useTokenSymbol}`;
    const useOnEdit = unstakeTFuelOrTheta
      ? undefined
      : (confirmTransactionData) => onEdit(confirmTransactionData);

    return (
      <ConfirmTransactionBase
        toAddress={toAddress}
        onEdit={useOnEdit}
        identiconAddress={tokenAddress}
        title={tokensText}
        subtitleComponent={this.renderSubtitleComponent()}
        primaryTotalTextOverride={`${
          tokenSymbol === TFUEL_SYMBOL ? '' : `${tokensText} + `
        }${ethTransactionTotal} ${nativeCurrency}`}
        secondaryTotalTextOverride={
          (tokenSymbol !== TFUEL_SYMBOL &&
            this.getSecondaryTotalTextOverride()) ||
          undefined
        }
        action={action}
        {...restProps}
      />
    );
  }
}
