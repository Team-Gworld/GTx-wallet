import { connect } from 'react-redux';
import { ETH, THETA } from '../../../helpers/constants/common';
import { getSendMaxModeState, getShouldShowFiat } from '../../../selectors';
import CurrencyInput from './currency-input.component';

const mapStateToProps = (state) => {
  const {
    metamask: {
      nativeCurrency,
      nativeCurrency2,
      currentCurrency,
      conversionRate,
    },
  } = state;
  const shouldShowFiat = getShouldShowFiat(state);
  const maxModeOn = getSendMaxModeState(state);

  return {
    nativeCurrency,
    nativeCurrency2,
    currentCurrency,
    conversionRate,
    hideFiat: !shouldShowFiat,
    maxModeOn,
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, nativeCurrency2, currentCurrency } = stateProps;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nativeSuffix: nativeCurrency || ETH,
    native2Suffix: nativeCurrency2 || THETA,
    fiatSuffix: currentCurrency.toUpperCase(),
  };
};

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput);
