import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { showModal, createCancelTransaction } from '../../../../store/actions';
import {
  getHexGasTotal,
  increaseLastGasPriceParams,
} from '../../../../helpers/utils/confirm-tx.util';
import CancelTransaction from './cancel-transaction.component';

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state;
  const { transactionId, originalGasPriceParams } = ownProps;
  const { currentNetworkTxList } = metamask;
  const transaction = currentNetworkTxList.find(
    ({ id }) => id === transactionId,
  );
  const transactionStatus = transaction ? transaction.status : '';

  const defaultNewGasPriceParams = increaseLastGasPriceParams(
    originalGasPriceParams,
  );
  const newGasFee = getHexGasTotal({
    gasPrice:
      defaultNewGasPriceParams.maxFeePerGas ??
      defaultNewGasPriceParams.gasPrice,
    gasLimit: '0x5208',
  });

  return {
    transactionId,
    transactionStatus,
    originalGasPriceParams,
    defaultNewGasPriceParams,
    newGasFee,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createCancelTransaction: (txId, customGasPriceParams) => {
      return dispatch(createCancelTransaction(txId, customGasPriceParams));
    },
    showTransactionConfirmedModal: () =>
      dispatch(showModal({ name: 'TRANSACTION_CONFIRMED' })),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionId, defaultNewGasPriceParams, ...restStateProps } =
    stateProps;
  // eslint-disable-next-line no-shadow
  const { createCancelTransaction, ...restDispatchProps } = dispatchProps;

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    createCancelTransaction: () =>
      createCancelTransaction(transactionId, defaultNewGasPriceParams),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(CancelTransaction);
