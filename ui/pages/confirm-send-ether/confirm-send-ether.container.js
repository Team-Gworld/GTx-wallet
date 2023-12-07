import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { ASSET_MODE, ASSET_TYPE } from '../../../shared/constants/transaction';
import { updateSend } from '../../store/actions';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import ConfirmSendEther from './confirm-send-ether.component';

const mapStateToProps = (state) => {
  const {
    confirmTransaction: { txData: { txParams } = {} },
  } = state;

  return {
    txParams,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: (txData) => {
      const { id, txParams } = txData;
      const {
        from,
        gas: gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        to,
        value,
        value2,
      } = txParams;

      const gasPriceParams = {
        ...(maxFeePerGas && {
          maxFeePerGas,
          maxPriorityFeePerGas,
        }),
        ...(!maxFeePerGas && {
          gasPrice,
        }),
      };
      const isNative2 = value2 && value2 !== '0x0';

      dispatch(
        updateSend({
          from,
          gasLimit,
          ...gasPriceParams,
          gasTotal: null,
          to,
          amount: isNative2 ? value2 : value,
          errors: { to: null, amount: null, holder: null },
          editingTransactionId: id && id.toString(),
          asset: {
            type: isNative2 ? ASSET_TYPE.NATIVE2 : ASSET_TYPE.NATIVE,
            mode: ASSET_MODE.SEND,
          },
        }),
      );

      dispatch(clearConfirmTransaction());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmSendEther);
