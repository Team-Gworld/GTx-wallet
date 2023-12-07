import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../ui/currency-display';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  ETH_SYMBOL,
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../../app/scripts/controllers/network/enums';
import { conversionUtil } from '../../../helpers/utils/conversion-util';

export default function UserPreferencedCurrencyDisplay({
  'data-testid': dataTestId,
  ethLogoHeight = 12,
  ethNumberOfDecimals,
  fiatNumberOfDecimals,
  numberOfDecimals: propsNumberOfDecimals,
  showEthLogo,
  type,
  ...restProps
}) {
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(type, {
    ethNumberOfDecimals,
    fiatNumberOfDecimals,
    numberOfDecimals: propsNumberOfDecimals,
  });
  const useCurrency = restProps.isNative2 ? THETA_SYMBOL : currency;

  const prefixComponent = useMemo(() => {
    return (
      (useCurrency === ETH_SYMBOL && showEthLogo && (
        <img src="./images/eth.svg" height={ethLogoHeight} alt="" />
      )) ||
      (useCurrency === TFUEL_SYMBOL && showEthLogo && (
        <img
          src="./images/contract/tfuel.svg"
          height={Math.round(ethLogoHeight * 1.384615385)}
          alt=""
        />
      )) ||
      (useCurrency === THETA_SYMBOL && showEthLogo && (
        <img
          src="./images/contract/theta.svg"
          height={Math.round(ethLogoHeight * 1.384615385)}
          alt=""
        />
      ))
    );
  }, [useCurrency, showEthLogo, ethLogoHeight]);

  return (
    <CurrencyDisplay
      {...restProps}
      currency={useCurrency}
      data-testid={dataTestId}
      numberOfDecimals={numberOfDecimals}
      prefixComponent={prefixComponent}
      suffix={restProps.suffix || undefined}
      displayValue={
        restProps.displayValue ||
        (restProps.isNative2
          ? conversionUtil(restProps.value, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              fromDenomination: 'WEI',
              numberOfDecimals: numberOfDecimals || 2,
            })
          : undefined)
      }
    />
  );
}

UserPreferencedCurrencyDisplay.propTypes = {
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  prefix: PropTypes.string,
  value: PropTypes.string,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  style: PropTypes.object,
  showEthLogo: PropTypes.bool,
  ethLogoHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.oneOf([PRIMARY, SECONDARY]),
  ethNumberOfDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  fiatNumberOfDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};
