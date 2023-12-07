import { addHexPrefix } from 'ethereumjs-util';
import {
  conversionUtil,
  conversionGreaterThan,
  conversionGTE,
} from '../helpers/utils/conversion-util';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { decEthToConvertedCurrency as ethTotalToConvertedCurrency } from '../helpers/utils/conversions.util';
import { formatETHFee } from '../helpers/utils/formatters';
import { calcGasTotal } from '../pages/send/send.utils';

import { GAS_ESTIMATE_TYPES } from '../helpers/constants/common';
import { baseFeeMultiplier } from '../../app/scripts/controllers/gas/gasPricingTracker';
import {
  getCurrentCurrency,
  getIsMainnet,
  getNativeCurrency,
  getNetworkEip1559Compatible,
  getPreferences,
} from '.';

const NUMBER_OF_DECIMALS_SM_BTNS = 5;

/*
export function getCustomGasErrors (state) {
  return state.gas.errors
}
*/

export function getCustomGasLimit(state) {
  return state.gas.customData.limit;
}

export function getCustomGasPriceParams(state) {
  return state.gas.customData.pricing;
}

/*
export function getCustomGasTotal (state) {
  return state.gas.customData.total
}
*/

export function getBasicGasEstimateLoadingStatus(state) {
  return state.gas.basicEstimateIsLoading;
}

export function getBasicGasEstimatesInGWEI(state) {
  return state.gas.basicEstimates;
}

export function getDefaultActiveButtonIndex(
  state,
  gasButtonInfo,
  customGasPriceParams,
) {
  const eip1559Compatible =
    customGasPriceParams?.maxFeePerGas === undefined
      ? getNetworkEip1559Compatible(state)
      : customGasPriceParams.maxFeePerGas;
  return gasButtonInfo.findIndex(({ gasPriceParams }) => {
    return eip1559Compatible
      ? gasPriceParams?.maxFeePerGas ===
          addHexPrefix(customGasPriceParams?.maxFeePerGas || '0') &&
          gasPriceParams?.maxPriorityFeePerGas ===
            addHexPrefix(customGasPriceParams?.maxPriorityFeePerGas || '0')
      : gasPriceParams?.gasPrice ===
          addHexPrefix(customGasPriceParams?.gasPrice || '0');
  });
}

export function getSafeLowEstimate(state) {
  const {
    gas: {
      basicEstimates: { safeLow },
    },
  } = state;

  return safeLow;
}

export function getBaseFeeEstimate(state) {
  const {
    gas: {
      basicEstimates: { baseFee },
    },
  } = state;

  return baseFee;
}

export function isCustomPriceSafe(state) {
  const safeLow = getSafeLowEstimate(state);
  const baseFee = getBaseFeeEstimate(state);
  const customGasPriceParams = getCustomGasPriceParams(state);

  if (
    !customGasPriceParams ||
    (!customGasPriceParams.maxFeePerGas && !customGasPriceParams.gasPrice)
  ) {
    return true;
  }

  if (safeLow === null) {
    return null;
  }

  let customPriceSafe;
  if (customGasPriceParams.maxFeePerGas) {
    const maxFeePerGasSafe = conversionGTE(
      {
        value: customGasPriceParams.maxFeePerGas,
        fromNumericBase: 'hex',
        fromDenomination: 'WEI',
        toDenomination: 'GWEI',
      },
      { value: baseFee + safeLow, fromNumericBase: 'dec' },
    );
    const maxPriorityFeePerGasSafe = conversionGTE(
      {
        value: customGasPriceParams.maxPriorityFeePerGas,
        fromNumericBase: 'hex',
        fromDenomination: 'WEI',
        toDenomination: 'GWEI',
      },
      { value: safeLow, fromNumericBase: 'dec' },
    );
    customPriceSafe = maxFeePerGasSafe && maxPriorityFeePerGasSafe;
  } else {
    customPriceSafe = conversionGreaterThan(
      {
        value: customGasPriceParams.gasPrice,
        fromNumericBase: 'hex',
        fromDenomination: 'WEI',
        toDenomination: 'GWEI',
      },
      { value: safeLow, fromNumericBase: 'dec' },
    );
  }

  return customPriceSafe;
}

export function basicPriceEstimateToETHTotal(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
) {
  return conversionUtil(calcGasTotal(gasLimit, estimate), {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'GWEI',
    numberOfDecimals,
  });
}

export function getRenderableEthFee(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
  nativeCurrency = 'ETH',
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee, nativeCurrency);
}

export function getRenderableConvertedCurrencyFee(
  estimate,
  gasLimit,
  convertedCurrency,
  conversionRate,
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit);
  const feeInCurrency = ethTotalToConvertedCurrency(
    fee,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(feeInCurrency, convertedCurrency);
}

export function priceEstimateToWei(priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  });
}

export function getGasPriceInHexWei(price) {
  const value = conversionUtil(price, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  return addHexPrefix(priceEstimateToWei(value));
}

export function getRenderableBasicEstimateData(state, gasLimit) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return [];
  }

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = isMainnet || Boolean(showFiatInTestnets);
  const { conversionRate } = state.metamask;
  const currentCurrency = getCurrentCurrency(state);
  const {
    gas: {
      basicEstimates: { baseFee, safeLow, average, fast },
    },
  } = state;

  const paddedBaseFee = (baseFee || 0) * baseFeeMultiplier;
  const safeLowComplete = safeLow + paddedBaseFee;
  const averageComplete = average + paddedBaseFee;
  const fastComplete = fast + paddedBaseFee;
  const nativeCurrency = getNativeCurrency(state);

  return [
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
      feeInPrimaryCurrency: getRenderableEthFee(
        safeLowComplete,
        gasLimit,
        9,
        nativeCurrency,
      ),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            safeLowComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      priceInHexWei: getGasPriceInHexWei(safeLowComplete),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: safeLowComplete,
          maxPriorityFeePerGas: safeLow,
        }),
        ...(!baseFee && {
          gasPrice: safeLow,
        }),
      },
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
      feeInPrimaryCurrency: getRenderableEthFee(
        averageComplete,
        gasLimit,
        9,
        nativeCurrency,
      ),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            averageComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      priceInHexWei: getGasPriceInHexWei(averageComplete),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: averageComplete,
          maxPriorityFeePerGas: average,
        }),
        ...(!baseFee && {
          gasPrice: average,
        }),
      },
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
      feeInPrimaryCurrency: getRenderableEthFee(
        fastComplete,
        gasLimit,
        9,
        nativeCurrency,
      ),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            fastComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      priceInHexWei: getGasPriceInHexWei(fastComplete),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: fastComplete,
          maxPriorityFeePerGas: fast,
        }),
        ...(!baseFee && {
          gasPrice: fast,
        }),
      },
    },
  ];
}

export function getRenderableEstimateDataForSmallButtonsFromGWEI(state) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return [];
  }

  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);
  const showFiat = isMainnet || Boolean(showFiatInTestnets);
  const gasLimit =
    state.metamask.send.gasLimit || getCustomGasLimit(state) || '0x5208';
  const { conversionRate } = state.metamask;
  const currentCurrency = getCurrentCurrency(state);
  const {
    gas: {
      basicEstimates: { baseFee, safeLow, average, fast },
    },
  } = state;

  const paddedBaseFee = (baseFee || 0) * baseFeeMultiplier;
  const safeLowComplete = safeLow + paddedBaseFee;
  const averageComplete = average + paddedBaseFee;
  const fastComplete = fast + paddedBaseFee;
  const nativeCurrency = getNativeCurrency(state);

  return [
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            safeLowComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        safeLowComplete,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        nativeCurrency,
      ),
      priceInHexWei: getGasPriceInHexWei(safeLowComplete, true),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: safeLowComplete,
          maxPriorityFeePerGas: safeLow,
        }),
        ...(!baseFee && {
          gasPrice: safeLow,
        }),
      },
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            averageComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        averageComplete,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        nativeCurrency,
      ),
      priceInHexWei: getGasPriceInHexWei(averageComplete, true),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: averageComplete,
          maxPriorityFeePerGas: average,
        }),
        ...(!baseFee && {
          gasPrice: average,
        }),
      },
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(
            fastComplete,
            gasLimit,
            currentCurrency,
            conversionRate,
          )
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(
        fastComplete,
        gasLimit,
        NUMBER_OF_DECIMALS_SM_BTNS,
        nativeCurrency,
      ),
      priceInHexWei: getGasPriceInHexWei(fastComplete, true),
      priceParams: {
        ...(baseFee && {
          maxFeePerGas: fastComplete,
          maxPriorityFeePerGas: fast,
        }),
        ...(!baseFee && {
          gasPrice: fast,
        }),
      },
    },
  ];
}
