import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import UnitInput from '../unit-input';
import CurrencyDisplay from '../currency-display';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
} from '../../../helpers/utils/conversions.util';
import { ETH } from '../../../helpers/constants/common';
import { ASSET_TYPE } from '../../../../shared/constants/transaction';

/**
 * Component that allows user to enter currency values as a number, and props receive a converted
 * hex value in WEI. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value depending on the currency (ETH or Fiat).
 */
export default class CurrencyInput extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    maxModeOn: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    onChange: PropTypes.func,
    useFiat: PropTypes.bool,
    hideFiat: PropTypes.bool,
    value: PropTypes.string,
    fiatSuffix: PropTypes.string,
    nativeSuffix: PropTypes.string,
    native2Suffix: PropTypes.string,
    assetType: PropTypes.string,
  };

  constructor(props) {
    super(props);

    const { value: hexValue } = props;
    const decimalValue = hexValue ? this.getDecimalValue(props) : 0;

    this.state = {
      decimalValue,
      hexValue,
      isSwapped: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { value: prevPropsHexValue } = prevProps;
    const { value: propsHexValue } = this.props;
    const { hexValue: stateHexValue } = this.state;

    if (
      prevPropsHexValue !== propsHexValue &&
      propsHexValue !== stateHexValue
    ) {
      const decimalValue = this.getDecimalValue(this.props);
      this.setState({ hexValue: propsHexValue, decimalValue });
    }
  }

  getDecimalValue(props) {
    const { value: hexValue, currentCurrency, conversionRate } = props;
    const decimalValueString = this.shouldUseFiat()
      ? getValueFromWeiHex({
          value: hexValue,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 2,
        })
      : getValueFromWeiHex({
          value: hexValue,
          toCurrency: ETH,
          numberOfDecimals: 6,
        });

    return Number(decimalValueString) || 0;
  }

  shouldUseFiat = () => {
    const { useFiat, hideFiat } = this.props;
    const { isSwapped } = this.state || {};

    if (hideFiat) {
      return false;
    }

    return isSwapped ? !useFiat : useFiat;
  };

  swap = () => {
    const { isSwapped, decimalValue } = this.state;
    this.setState({ isSwapped: !isSwapped }, () => {
      this.handleChange(decimalValue);
    });
  };

  handleChange = (decimalValue) => {
    const {
      currentCurrency: fromCurrency,
      conversionRate,
      onChange,
    } = this.props;

    const hexValue = this.shouldUseFiat()
      ? getWeiHexFromDecimalValue({
          value: decimalValue,
          fromCurrency,
          conversionRate,
          invertConversionRate: true,
        })
      : getWeiHexFromDecimalValue({
          value: decimalValue,
          fromCurrency: ETH,
          fromDenomination: ETH,
          conversionRate,
        });

    this.setState({ hexValue, decimalValue });
    onChange(hexValue);
  };

  renderConversionComponent() {
    const { currentCurrency, nativeCurrency, hideFiat } = this.props;
    const { hexValue } = this.state;
    let currency, numberOfDecimals;

    if (hideFiat) {
      return (
        <div className="currency-input__conversion-component">
          {this.context.t('noConversionRateAvailable')}
        </div>
      );
    }

    if (this.shouldUseFiat()) {
      // Display ETH
      currency = nativeCurrency || ETH;
      numberOfDecimals = 6;
    } else {
      // Display Fiat
      currency = currentCurrency;
      numberOfDecimals = 2;
    }

    return (
      <CurrencyDisplay
        className="currency-input__conversion-component"
        currency={currency}
        value={hexValue}
        numberOfDecimals={numberOfDecimals}
      />
    );
  }

  render() {
    const {
      fiatSuffix,
      nativeSuffix,
      native2Suffix,
      assetType,
      maxModeOn,
      ...restProps
    } = this.props;
    const { decimalValue } = this.state;

    let suffix;
    if (this.shouldUseFiat()) {
      suffix = fiatSuffix;
    } else {
      suffix = assetType === ASSET_TYPE.NATIVE2 ? native2Suffix : nativeSuffix;
    }

    return (
      <UnitInput
        {...restProps}
        suffix={suffix}
        onChange={this.handleChange}
        value={decimalValue}
        maxModeOn={maxModeOn}
        actionComponent={
          assetType === ASSET_TYPE.NATIVE && (
            <div
              className="currency-input__swap-component"
              onClick={this.swap}
            />
          )
        }
      >
        {assetType === ASSET_TYPE.NATIVE && this.renderConversionComponent()}
      </UnitInput>
    );
  }
}
