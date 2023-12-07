import { cloneDeep } from 'lodash';
import { addHexPrefix } from 'ethereumjs-util';
import {
  loadLocalStorageData,
  saveLocalStorageData,
} from '../../lib/local-storage-helpers';
import { getBasicGasEstimates } from '../../selectors';
import { decGWEIToHexWEI } from '../../helpers/utils/conversions.util';

// Actions
const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
  'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED';
const BASIC_GAS_ESTIMATE_LOADING_STARTED =
  'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED';
const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE';
const RESET_CUSTOM_DATA = 'metamask/gas/RESET_CUSTOM_DATA';
const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS';
const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
const SET_CUSTOM_GAS_PRICING = 'metamask/gas/SET_CUSTOM_GAS_PRICE';
const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL';
const SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED =
  'metamask/gas/SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED';

const initState = {
  customData: {
    pricing: null,
    limit: null,
  },
  basicEstimates: {
    baseFee: null, // if there is a baseFee, average, fast, and safeLow are priority fees to be added to the baseFee, otherwise, gas amounts
    average: null,
    fast: null,
    safeLow: null,
  },
  basicEstimateIsLoading: true,
  basicPriceEstimatesLastRetrieved: 0,
  errors: {},
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case BASIC_GAS_ESTIMATE_LOADING_STARTED:
      return {
        ...state,
        basicEstimateIsLoading: true,
      };
    case BASIC_GAS_ESTIMATE_LOADING_FINISHED:
      return {
        ...state,
        basicEstimateIsLoading: false,
      };
    case SET_BASIC_GAS_ESTIMATE_DATA:
      return {
        ...state,
        basicEstimates: action.value,
      };
    case SET_CUSTOM_GAS_PRICING:
      return {
        ...state,
        customData: {
          ...state.customData,
          pricing: action.value,
        },
      };
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value,
        },
      };
    case SET_CUSTOM_GAS_TOTAL:
      return {
        ...state,
        customData: {
          ...state.customData,
          total: action.value,
        },
      };
    case SET_CUSTOM_GAS_ERRORS:
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.value,
        },
      };
    case SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED:
      return {
        ...state,
        basicPriceEstimatesLastRetrieved: action.value,
      };
    case RESET_CUSTOM_DATA:
      return {
        ...state,
        customData: cloneDeep(initState.customData),
      };
    case RESET_CUSTOM_GAS_STATE:
      return cloneDeep(initState);
    default:
      return state;
  }
}

// Action Creators
export function basicGasEstimatesLoadingStarted() {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
  };
}

export function basicGasEstimatesLoadingFinished() {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
  };
}

export function fetchBasicGasEstimates() {
  // TODO: likely can remove caching here now that there is background gas tracking
  return async (dispatch, getState) => {
    const state = getState();

    dispatch(basicGasEstimatesLoadingStarted());

    const basicEstimates = getBasicGasEstimates(state);
    if (basicEstimates) {
      saveLocalStorageData(basicEstimates, 'BASIC_PRICE_ESTIMATES');

      dispatch(setBasicGasEstimateData(basicEstimates));
      dispatch(basicGasEstimatesLoadingFinished());
    }

    return basicEstimates;
  };
}

export function setCustomGasPriceParamsForRetry(newGasPriceParams) {
  return (dispatch) => {
    if (
      !newGasPriceParams ||
      (!newGasPriceParams.maxFeePerGas && !newGasPriceParams.gasPrice) ||
      newGasPriceParams.maxFeePerGas === '0x0' ||
      newGasPriceParams.gasPrice === '0x0'
    ) {
      const { fast, baseFee } = loadLocalStorageData('BASIC_PRICE_ESTIMATES');
      const useGasPriceParams = {
        ...(baseFee && {
          maxFeePerGas: addHexPrefix(decGWEIToHexWEI(baseFee + fast)),
          maxPriorityFeePerGas: addHexPrefix(decGWEIToHexWEI(fast)),
        }),
        ...(!baseFee && {
          gasPrice: addHexPrefix(decGWEIToHexWEI(fast)),
        }),
      };
      dispatch(setCustomGasPriceParams(useGasPriceParams));
    } else {
      dispatch(setCustomGasPriceParams(newGasPriceParams));
    }
  };
}

export function setBasicGasEstimateData(basicGasEstimateData) {
  return {
    type: SET_BASIC_GAS_ESTIMATE_DATA,
    value: basicGasEstimateData,
  };
}

export function setCustomGasPriceParams(newGasPriceParams) {
  return {
    type: SET_CUSTOM_GAS_PRICING,
    value: newGasPriceParams,
  };
}

export function setCustomGasLimit(newLimit) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  };
}

export function setCustomGasTotal(newTotal) {
  return {
    type: SET_CUSTOM_GAS_TOTAL,
    value: newTotal,
  };
}

export function setCustomGasErrors(newErrors) {
  return {
    type: SET_CUSTOM_GAS_ERRORS,
    value: newErrors,
  };
}

export function setBasicPriceEstimatesLastRetrieved(retrievalTime) {
  return {
    type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED,
    value: retrievalTime,
  };
}

export function resetCustomGasState() {
  return { type: RESET_CUSTOM_GAS_STATE };
}

export function resetCustomData() {
  return { type: RESET_CUSTOM_DATA };
}
