import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { showSidebar } from '../store/actions';
import {
  fetchBasicGasEstimates,
  setCustomGasPriceParamsForRetry,
  setCustomGasLimit,
} from '../ducks/gas/gas.duck';
import { increaseLastGasPriceParams } from '../helpers/utils/confirm-tx.util';

/**
 * Provides a reusable hook that, given a transactionGroup, will return
 * a method for beginning the retry process
 * @param {Object} transactionGroup - the transaction group
 * @return {Function}
 */
export function useRetryTransaction(transactionGroup) {
  const { primaryTransaction, initialTransaction } = transactionGroup;
  // Signature requests do not have a txParams, but this hook is called indiscriminately
  const gasPriceParams = {};
  ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'].forEach((key) => {
    if (primaryTransaction.txParams?.[key]) {
      gasPriceParams[key] = primaryTransaction.txParams[key];
    }
  });
  const dispatch = useDispatch();

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();

      await dispatch(fetchBasicGasEstimates);
      const transaction = initialTransaction;
      const increasedGasPriceParams =
        increaseLastGasPriceParams(gasPriceParams);
      dispatch(
        setCustomGasPriceParamsForRetry(
          increasedGasPriceParams || gasPriceParams,
        ),
      );
      dispatch(setCustomGasLimit(transaction.txParams.gas));
      dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: { transaction },
        }),
      );
    },
    [dispatch, initialTransaction, gasPriceParams],
  );

  return retryTransaction;
}
