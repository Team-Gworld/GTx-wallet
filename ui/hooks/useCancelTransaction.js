import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { THETAMAINNET_NETWORK_ID } from '../../app/scripts/controllers/network/enums';
import { showModal } from '../store/actions';
import { isBalanceSufficient } from '../pages/send/send.utils';
import {
  getHexGasTotal,
  increaseLastGasPriceParams,
} from '../helpers/utils/confirm-tx.util';
import { getConversionRate, getSelectedAccount } from '../selectors';

/**
 * Determine whether a transaction can be cancelled and provide a method to
 * kick off the process of cancellation.
 *
 * Provides a reusable hook that, given a transactionGroup, will return
 * whether or not the account has enough funds to cover the gas cancellation
 * fee, and a method for beginning the cancellation process
 * @param {Object} transactionGroup
 * @return {[boolean, Function]}
 */
export function useCancelTransaction(transactionGroup) {
  const { primaryTransaction, initialTransaction } = transactionGroup;
  const gasPriceParams = {};
  ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'].forEach((key) => {
    if (primaryTransaction.txParams?.[key]) {
      gasPriceParams[key] = primaryTransaction.txParams[key];
    }
  });
  const canCancel =
    initialTransaction?.metamaskNetworkId !== THETAMAINNET_NETWORK_ID; // TODO: add fixedGasPrice to network properties and use that here instead (and in other places)
  const { id } = initialTransaction;
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const cancelTransaction = useCallback(
    (event) => {
      event.stopPropagation();

      return dispatch(
        showModal({
          name: 'CANCEL_TRANSACTION',
          transactionId: id,
          originalGasPriceParams: gasPriceParams,
        }),
      );
    },
    [dispatch, id, gasPriceParams],
  );

  const increasedGasParams = increaseLastGasPriceParams(gasPriceParams);
  const hasEnoughCancelGas =
    primaryTransaction.txParams &&
    isBalanceSufficient({
      amount: '0x0',
      gasTotal: getHexGasTotal({
        gasPrice:
          increasedGasParams.maxFeePerGas ?? increasedGasParams.gasPrice,
        gasLimit: primaryTransaction.txParams.gas,
      }),
      balance: selectedAccount.balance,
      conversionRate,
    });

  return [
    canCancel && hasEnoughCancelGas,
    canCancel ? cancelTransaction : undefined,
  ];
}
