import { connect } from 'react-redux';
import { addHexPrefix } from 'ethereumjs-util';
import {
  getConversionRate,
  getGasTotal,
  getGasPriceParams,
  getGasLimit,
  getSendAmount,
  getSendFromBalance,
  getSendFromBalance2,
  getTokenBalance,
  getSendMaxModeState,
  getGasLoadingError,
  gasFeeIsInError,
  getGasButtonGroupShown,
  getAdvancedInlineGasShown,
  getCurrentEthBalance,
  getSendAsset,
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
  getIsMainnet,
} from '../../../../selectors';
import { isBalanceSufficient, calcGasTotal } from '../../send.utils';
import { calcMaxAmount } from '../send-amount-row/amount-max-button/amount-max-button.utils';
import {
  showGasButtonGroup,
  updateSendErrors,
} from '../../../../ducks/send/send.duck';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import {
  resetCustomData,
  setCustomGasPriceParams,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck';
import {
  showModal,
  setGasPriceParams,
  setGasLimit,
  setGasTotal,
  updateSendAmount,
} from '../../../../store/actions';
import { decGWEIToHexWEI } from '../../../../helpers/utils/conversions.util';
import SendGasRow from './send-gas-row.component';

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SendGasRow);

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPriceParams = getGasPriceParams(state);
  const gasLimit = getGasLimit(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    state,
    gasButtonInfo,
    gasPriceParams,
  );

  const gasTotal = getGasTotal(state);
  const conversionRate = getConversionRate(state);
  const balance = getCurrentEthBalance(state);

  const assetType = getSendAsset(state)?.type;
  const insufficientBalance = !isBalanceSufficient({
    amount: assetType === ASSET_TYPE.NATIVE ? getSendAmount(state) : '0x0',
    gasTotal,
    balance,
    conversionRate,
  });

  return {
    balance: getSendFromBalance(state),
    balance2: getSendFromBalance2(state),
    gasTotal,
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: getGasLoadingError(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
      defaultActiveButtonIndex: 1,
      newActiveButtonIndex: activeButtonIndex > -1 ? activeButtonIndex : null,
      gasButtonInfo,
    },
    gasButtonGroupShown: getGasButtonGroupShown(state),
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    gasPriceParams,
    gasLimit,
    insufficientBalance,
    maxModeOn: getSendMaxModeState(state),
    sendAsset: getSendAsset(state),
    tokenBalance: getTokenBalance(state),
    isMainnet: getIsMainnet(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showCustomizeGasModal: () =>
      dispatch(showModal({ name: 'CUSTOMIZE_GAS', hideBasic: true })),
    setGasPriceParams: (newGasPriceParams, gasLimit) => {
      const useNewGasPriceParams = { ...newGasPriceParams };
      Object.keys(useNewGasPriceParams).forEach((k) => {
        if (typeof useNewGasPriceParams[k] === 'number') {
          useNewGasPriceParams[k] = addHexPrefix(
            decGWEIToHexWEI(useNewGasPriceParams[k]),
          );
        }
      });
      dispatch(setGasPriceParams(useNewGasPriceParams));
      dispatch(setCustomGasPriceParams(useNewGasPriceParams));
      if (gasLimit) {
        dispatch(
          setGasTotal(
            calcGasTotal(
              gasLimit,
              useNewGasPriceParams.maxFeePerGas ??
                useNewGasPriceParams.gasPrice,
            ),
          ),
        );
      }
    },
    setGasLimit: (newLimit, gasPrice) => {
      dispatch(setGasLimit(newLimit));
      dispatch(setCustomGasLimit(newLimit));
      if (gasPrice) {
        dispatch(setGasTotal(calcGasTotal(newLimit, gasPrice)));
      }
    },
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }));
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)));
    },
    showGasButtonGroup: () => dispatch(showGasButtonGroup()),
    resetCustomData: () => dispatch(resetCustomData()),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps;
  const { gasButtonInfo } = gasPriceButtonGroupProps;
  const {
    setGasPriceParams: dispatchSetGasPriceParams,
    showGasButtonGroup: dispatchShowGasButtonGroup,
    resetCustomData: dispatchResetCustomData,
    ...otherDispatchProps
  } = dispatchProps;

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchSetGasPriceParams,
    },
    resetGasButtons: () => {
      dispatchResetCustomData();
      dispatchSetGasPriceParams(gasButtonInfo[1].priceParams);
      dispatchShowGasButtonGroup();
    },
    setGasPriceParams: dispatchSetGasPriceParams,
  };
}
