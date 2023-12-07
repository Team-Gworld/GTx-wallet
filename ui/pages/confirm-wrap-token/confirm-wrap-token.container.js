import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { updateSend, showSendTokenPage } from '../../store/actions';
import { sendTokenTokenAmountAndToAddressSelector } from '../../selectors';
import { wrapInfoFromTxParams } from '../send/send.utils';
import ConfirmWrapToken from './confirm-wrap-token.component';

const mapStateToProps = (state) => {
  const { tokenAmount } = sendTokenTokenAmountAndToAddressSelector(state);
  const { action } =
    wrapInfoFromTxParams(state.confirmTransaction?.txData?.txParams) || {};

  return {
    tokenAmount,
    action,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: ({ txData, tokenProps }) => {
      const {
        id,
        txParams: { from, to: tokenAddress, gas: gasLimit, gasPrice } = {},
      } = txData;
      const { assetType, assetMode, tokenAmount, toAddress } =
        wrapInfoFromTxParams(txData?.txParams) || {};

      dispatch(
        updateSend({
          from,
          gasLimit,
          gasPrice,
          gasTotal: null,
          to: toAddress,
          amount: tokenAmount,
          errors: { to: null, amount: null, holder: null },
          editingTransactionId: id && id.toString(),
          asset: {
            ...tokenProps,
            address: tokenAddress,
            type: assetType,
            mode: assetMode,
          },
        }),
      );
      dispatch(clearConfirmTransaction());
      dispatch(showSendTokenPage());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmWrapToken);
