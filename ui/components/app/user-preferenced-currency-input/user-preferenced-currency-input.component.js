import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CurrencyInput from '../../ui/currency-input';

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    assetType: PropTypes.string,
  };

  render() {
    const { useNativeCurrencyAsPrimaryCurrency, assetType, ...restProps } =
      this.props;

    return (
      <CurrencyInput
        {...restProps}
        useFiat={!useNativeCurrencyAsPrimaryCurrency}
        assetType={assetType}
      />
    );
  }
}
