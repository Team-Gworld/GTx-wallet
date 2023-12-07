import { connect } from 'react-redux';
import { addHexPrefix } from 'ethereumjs-util';
import { showModal } from '../../../../store/actions';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../../helpers/utils/conversions.util';
import {
  getBasicGasEstimatesInGWEI,
  getNetworkEip1559Compatible,
  getNetworkGasFixedPrice,
} from '../../../../selectors';
import AdvancedGasInputs from './advanced-gas-inputs.component';

function convertGasPriceParamsFromGWEI(gasPriceParamsInGWEI) {
  const out = { ...gasPriceParamsInGWEI };
  Object.keys(out).forEach((k) => {
    out[k] = addHexPrefix(decGWEIToHexWEI(out[k]));
  });
  return out;
}

function convertGasLimitForInputs(gasLimitInHexWEI) {
  return parseInt(gasLimitInHexWEI, 16) || 0;
}

function mapStateToProps(state) {
  return {
    supportsEip1559: getNetworkEip1559Compatible(state) ?? false,
    fixedPrice: getNetworkGasFixedPrice(state) ?? false,
    basicGasEstimatesInGWEI: getBasicGasEstimatesInGWEI(state),
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    showGasPriceInfoModal: () =>
      dispatch(showModal({ name: 'GAS_PRICE_INFO_MODAL' })),
    showGasMaxFeeInfoModal: () =>
      dispatch(showModal({ name: 'GAS_MAX_FEE_INFO_MODAL' })),
    showGasPriorityFeeInfoModal: () =>
      dispatch(showModal({ name: 'GAS_PRIORITY_FEE_INFO_MODAL' })),
    showGasLimitInfoModal: () =>
      dispatch(showModal({ name: 'GAS_LIMIT_INFO_MODAL' })),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    customGasPriceParams,
    customGasLimit,
    updateCustomGasPriceParams,
    updateCustomGasLimit,
  } = ownProps;
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    customGasPriceParams,
    customGasLimit: convertGasLimitForInputs(customGasLimit),
    updateCustomGasPriceParamsFromGWEI: (priceParams) =>
      updateCustomGasPriceParams(convertGasPriceParamsFromGWEI(priceParams)),
    updateCustomGasLimit: (limit) => updateCustomGasLimit(decimalToHex(limit)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(AdvancedGasInputs);
