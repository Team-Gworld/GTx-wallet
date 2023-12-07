import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { ASSET_MODE, ASSET_TYPE } from '../../../shared/constants/transaction';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { updateSend, showSendTokenPage } from '../../store/actions';
import { conversionUtil } from '../../helpers/utils/conversion-util';
import { sendTokenTokenAmountAndToAddressSelector } from '../../selectors';
import ConfirmSendToken from './confirm-send-token.component';

const mapStateToProps = (state) => {
  const { tokenAmount } = sendTokenTokenAmountAndToAddressSelector(state);

  return {
    tokenAmount,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: ({ txData, tokenData, tokenProps }) => {
      const {
        id,
        txParams: { from, to: tokenAddress, gas: gasLimit, gasPrice } = {},
      } = txData;

      const { params = [] } = tokenData;
      const { value: to } = params[0] || {};
      const { value: tokenAmountInDec } = params[1] || {};

      const tokenAmountInHex = conversionUtil(tokenAmountInDec, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
      });

      dispatch(
        updateSend({
          from,
          gasLimit,
          gasPrice,
          gasTotal: null,
          to,
          amount: tokenAmountInHex,
          errors: { to: null, amount: null, holder: null },
          editingTransactionId: id && id.toString(),
          asset: {
            ...tokenProps,
            address: tokenAddress,
            type: ASSET_TYPE.TOKEN,
            mode: ASSET_MODE.SEND,
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
)(ConfirmSendToken);
