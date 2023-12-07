import { connect } from 'react-redux';
import { addHexPrefix } from 'ethereumjs-util';
import {
  hideModal,
  setGasLimit,
  setGasPriceParams,
  createRetryTransaction,
  createSpeedUpTransaction,
  hideSidebar,
  updateSendAmount,
  setGasTotal,
  updateTransaction,
} from '../../../../store/actions';
import {
  setCustomGasPriceParams,
  setCustomGasLimit,
  resetCustomData,
  fetchBasicGasEstimates,
} from '../../../../ducks/gas/gas.duck';
import {
  hideGasButtonGroup,
  updateSendErrors,
} from '../../../../ducks/send/send.duck';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import {
  conversionRateSelector as getConversionRate,
  getCurrentCurrency,
  getCurrentEthBalance,
  getCurrentThetaBalance,
  getIsMainnet,
  getSendAsset,
  getPreferences,
  getBasicGasEstimateLoadingStatus,
  getCustomGasLimit,
  getCustomGasPriceParams,
  getDefaultActiveButtonIndex,
  getRenderableBasicEstimateData,
  isCustomPriceSafe,
  getTokenBalance,
  getSendMaxModeState,
  getNetworkEip1559Compatible,
  getBasicGasEstimates,
  getNativeCurrency,
} from '../../../../selectors';

import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  addHexWEIsToDec,
  subtractHexWEIsToDec,
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
  decGWEIToHexWEI,
} from '../../../../helpers/utils/conversions.util';
import { formatETHFee } from '../../../../helpers/utils/formatters';
import {
  calcGasTotal,
  isBalanceSufficient,
} from '../../../../pages/send/send.utils';
import { calcMaxAmount } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.utils';
import { baseFeeMultiplier } from '../../../../../app/scripts/controllers/gas/gasPricingTracker';
import GasModalPageContainer from './gas-modal-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { currentNetworkTxList, send } = state.metamask;
  const { modalState: { props: modalProps } = {} } = state.appState.modal || {};
  const { txData = {} } = modalProps || {};
  const { transaction = {} } = ownProps;
  const selectedTransaction = currentNetworkTxList.find(
    ({ id }) => id === (transaction.id || txData.id),
  );

  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state);
  const sendAsset = getSendAsset(state);

  let useEip1559 = null;
  if (selectedTransaction?.txParams) {
    if (selectedTransaction?.txParams?.maxFeePerGas) {
      useEip1559 = true;
    } else if (selectedTransaction?.txParams?.gasPrice) {
      useEip1559 = false;
    }
  }
  if (useEip1559 === null) {
    useEip1559 = getNetworkEip1559Compatible(state) ?? false;
  }

  // a "default" txParams is used during the send flow, since the transaction doesn't exist yet in that case
  const gasPricing = getBasicGasEstimates(state);
  const gasPriceParams = {
    ...(useEip1559 && {
      maxFeePerGas:
        send.gasPriceParams?.maxFeePerGas ||
        addHexPrefix(
          decGWEIToHexWEI(
            (gasPricing.baseFee || 0) * baseFeeMultiplier +
              (gasPricing.average || 0),
          ),
        ),
      maxPriorityFeePerGas:
        send.gasPriceParams?.maxPriorityFeePerGas ||
        addHexPrefix(decGWEIToHexWEI(gasPricing.average)),
    }),
    ...(!useEip1559 && {
      gasPrice:
        send.gasPriceParams?.gasPrice ||
        addHexPrefix(
          decGWEIToHexWEI(gasPricing.average + (gasPricing.baseFee ?? 0)),
        ),
    }),
  };
  const txParams = selectedTransaction?.txParams ?? {
    gas: send.gasLimit || '0x5208',
    ...gasPriceParams,
    value: sendAsset.type === ASSET_TYPE.NATIVE ? send.amount : '0x0',
    isThetaNative:
      state.metamask.provider?.rpcPrefs?.selectedNative || undefined,
  };

  const {
    gasPrice: currentGasPrice,
    maxFeePerGas: currentMaxFeePerGas,
    maxPriorityFeePerGas: currentMaxPriorityFeePerGas,
    gas: currentGasLimit,
    value,
  } = txParams;
  const customModalGasPriceParams = getCustomGasPriceParams(state) || {
    ...(currentMaxFeePerGas && {
      maxFeePerGas: currentMaxFeePerGas,
      maxPriorityFeePerGas: currentMaxPriorityFeePerGas,
    }),
    ...(!currentMaxFeePerGas && {
      gasPrice: currentGasPrice,
    }),
  };
  Object.keys(customModalGasPriceParams).forEach((k) => {
    if (typeof customModalGasPriceParams[k] === 'number') {
      customModalGasPriceParams[k] = addHexPrefix(
        decGWEIToHexWEI(customModalGasPriceParams[k]),
      );
    }
  });
  const customModalGasLimitInHex =
    getCustomGasLimit(state) || currentGasLimit || '0x5208';
  const customGasTotal = calcGasTotal(
    customModalGasLimitInHex,
    customModalGasPriceParams.maxFeePerGas ??
      customModalGasPriceParams.gasPrice,
  );

  const gasButtonInfo = getRenderableBasicEstimateData(
    state,
    customModalGasLimitInHex,
  );

  const currentCurrency = getCurrentCurrency(state);
  const conversionRate = getConversionRate(state);

  const newTotalFiat = addHexWEIsToRenderableFiat(
    value,
    customGasTotal,
    currentCurrency,
    conversionRate,
  );

  const { hideBasic } = state.appState.modal.modalState.props;

  const customGasPriceParams = customModalGasPriceParams;

  const maxModeOn = getSendMaxModeState(state);

  const balance = getCurrentEthBalance(state);
  const balance2 = getCurrentThetaBalance(state);
  const nativeCurrency = getNativeCurrency(state);

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = Boolean(isMainnet || showFiatInTestnets);

  const isSendAssetSet = Boolean(sendAsset);

  const newTotalEth =
    maxModeOn && !isSendAssetSet
      ? addHexWEIsToRenderableEth(balance, '0x0', nativeCurrency)
      : addHexWEIsToRenderableEth(value, customGasTotal, nativeCurrency);

  const sendAmount =
    maxModeOn && !isSendAssetSet
      ? subtractHexWEIsFromRenderableEth(
          balance,
          customGasTotal,
          nativeCurrency,
        )
      : addHexWEIsToRenderableEth(value, '0x0', nativeCurrency);

  const insufficientBalance = maxModeOn
    ? false
    : !isBalanceSufficient({
        amount: value,
        gasTotal: customGasTotal,
        balance: sendAsset?.type === ASSET_TYPE.NATIVE2 ? balance2 : balance,
        conversionRate,
      });

  return {
    hideBasic,
    isConfirm: isConfirm(state),
    customModalGasPriceParamsInHex: customModalGasPriceParams,
    customModalGasLimitInHex,
    customGasPriceParams,
    customGasLimit: calcCustomGasLimit(customModalGasLimitInHex),
    customGasTotal,
    newTotalFiat,
    customPriceIsSafe: isCustomPriceSafe(state),
    maxModeOn,
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(
        state,
        gasButtonInfo,
        customModalGasPriceParams,
      ),
      gasButtonInfo,
    },
    infoRowProps: {
      originalTotalFiat: addHexWEIsToRenderableFiat(
        value,
        customGasTotal,
        currentCurrency,
        conversionRate,
      ),
      originalTotalEth: addHexWEIsToRenderableEth(
        value,
        customGasTotal,
        nativeCurrency,
      ),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth,
      transactionFee: addHexWEIsToRenderableEth(
        '0x0',
        customGasTotal,
        nativeCurrency,
      ),
      sendAmount,
    },
    transaction: txData || transaction,
    isSpeedUp: transaction.status === 'submitted',
    isRetry: transaction.status === 'failed',
    txId: transaction.id,
    insufficientBalance,
    isMainnet,
    sendAsset,
    balance,
    balance2,
    tokenBalance: getTokenBalance(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  const updateCustomGasPriceParams = (newPriceParams) => {
    dispatch(setCustomGasPriceParams(newPriceParams));
  };

  return {
    cancelAndClose: () => {
      dispatch(resetCustomData());
      dispatch(hideModal());
    },
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPriceParams,
    updateCustomGasLimit: (newLimit) =>
      dispatch(setCustomGasLimit(addHexPrefix(newLimit))),
    setGasData: (newLimit, newPriceParams) => {
      dispatch(setGasLimit(newLimit));
      dispatch(setGasPriceParams(newPriceParams));
    },
    updateConfirmTxGasAndCalculate: (gasLimit, gasPriceParams, updatedTx) => {
      updateCustomGasPriceParams(gasPriceParams);
      dispatch(setCustomGasLimit(addHexPrefix(gasLimit.toString(16))));
      return dispatch(updateTransaction(updatedTx));
    },
    createRetryTransaction: (txId, gasPriceParams, gasLimit) => {
      return dispatch(createRetryTransaction(txId, gasPriceParams, gasLimit));
    },
    createSpeedUpTransaction: (txId, gasPriceParams, gasLimit) => {
      return dispatch(createSpeedUpTransaction(txId, gasPriceParams, gasLimit));
    },
    hideGasButtonGroup: () => dispatch(hideGasButtonGroup()),
    hideSidebar: () => dispatch(hideSidebar()),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    setGasTotal: (total) => dispatch(setGasTotal(total)),
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }));
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)));
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    gasPriceButtonGroupProps,
    // eslint-disable-next-line no-shadow
    isConfirm,
    txId,
    isSpeedUp,
    isRetry,
    insufficientBalance,
    maxModeOn,
    customGasPriceParams,
    customGasTotal,
    balance,
    balance2,
    sendAsset,
    tokenBalance,
    customGasLimit,
    transaction,
  } = stateProps;
  const {
    hideGasButtonGroup: dispatchHideGasButtonGroup,
    setGasData: dispatchSetGasData,
    updateConfirmTxGasAndCalculate: dispatchUpdateConfirmTxGasAndCalculate,
    createSpeedUpTransaction: dispatchCreateSpeedUpTransaction,
    createRetryTransaction: dispatchCreateRetryTransaction,
    hideSidebar: dispatchHideSidebar,
    cancelAndClose: dispatchCancelAndClose,
    hideModal: dispatchHideModal,
    setAmountToMax: dispatchSetAmountToMax,
    ...otherDispatchProps
  } = dispatchProps;

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    onSubmit: (gasLimit, gasPriceParams) => {
      if (isConfirm) {
        const txParamsNoGasPriceParams = {
          ...transaction.txParams,
        };
        delete txParamsNoGasPriceParams.gasPrice;
        delete txParamsNoGasPriceParams.maxFeePerGas;
        delete txParamsNoGasPriceParams.maxPriorityFeePerGas;
        const updatedTx = {
          ...transaction,
          txParams: {
            ...txParamsNoGasPriceParams,
            gas: gasLimit,
            ...gasPriceParams,
          },
        };
        dispatchUpdateConfirmTxGasAndCalculate(
          gasLimit,
          gasPriceParams,
          updatedTx,
        );
        dispatchHideModal();
      } else if (isSpeedUp) {
        dispatchCreateSpeedUpTransaction(txId, gasPriceParams, gasLimit);
        dispatchHideSidebar();
        dispatchCancelAndClose();
      } else if (isRetry) {
        dispatchCreateRetryTransaction(txId, gasPriceParams, gasLimit);
        dispatchHideSidebar();
        dispatchCancelAndClose();
      } else {
        dispatchSetGasData(gasLimit, gasPriceParams);
        dispatchHideGasButtonGroup();
        dispatchCancelAndClose();
      }
      if (maxModeOn) {
        dispatchSetAmountToMax({
          balance,
          balance2,
          gasTotal: customGasTotal,
          sendAsset,
          tokenBalance,
        });
      }
    },
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: otherDispatchProps.updateCustomGasPriceParams,
    },
    cancelAndClose: () => {
      dispatchCancelAndClose();
      if (isSpeedUp || isRetry) {
        dispatchHideSidebar();
      }
    },
    disableSave:
      insufficientBalance ||
      (isSpeedUp &&
        customGasPriceParams.minFeePerGas === 0 &&
        customGasPriceParams.gasPrice === 0) ||
      customGasLimit < 21000,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(GasModalPageContainer);

function isConfirm(state) {
  return Boolean(Object.keys(state.confirmTransaction.txData).length);
}

function calcCustomGasLimit(customGasLimitInHex) {
  return parseInt(customGasLimitInHex, 16);
}

function addHexWEIsToRenderableEth(aHexWEI, bHexWEI, nativeCurrency = 'ETH') {
  return formatETHFee(addHexWEIsToDec(aHexWEI, bHexWEI), nativeCurrency);
}

function subtractHexWEIsFromRenderableEth(
  aHexWEI,
  bHexWEI,
  nativeCurency = 'ETH',
) {
  return formatETHFee(subtractHexWEIsToDec(aHexWEI, bHexWEI), nativeCurency);
}

function addHexWEIsToRenderableFiat(
  aHexWEI,
  bHexWEI,
  convertedCurrency,
  conversionRate,
) {
  const ethTotal = ethTotalToConvertedCurrency(
    addHexWEIsToDec(aHexWEI, bHexWEI),
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(ethTotal, convertedCurrency);
}
