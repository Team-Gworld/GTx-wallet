import { connect } from 'react-redux';
import { clearSend, signTx, updateTransaction } from '../../../store/actions';
import {
  getGasLimit,
  getGasPriceParams,
  getGasTotal,
  getSendAsset,
  getSendAmount,
  getSendEditingTransactionId,
  getSendFromObject,
  getTokenBalance,
  getUnapprovedTxs,
  isSendFormInError,
  getGasIsLoading,
} from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import WrapFooter from './wrap-footer.component';
import { constructTxParams, constructUpdatedTx } from './wrap-footer.utils';

export default connect(mapStateToProps, mapDispatchToProps)(WrapFooter);

function mapStateToProps(state) {
  const editingTransactionId = getSendEditingTransactionId(state);

  return {
    amount: getSendAmount(state),
    editingTransactionId,
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPriceParams: getGasPriceParams(state),
    gasTotal: getGasTotal(state),
    inError: isSendFormInError(state),
    sendAsset: getSendAsset(state),
    tokenBalance: getTokenBalance(state),
    unapprovedTxs: getUnapprovedTxs(state),
    gasIsLoading: getGasIsLoading(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    sign: (opts) => {
      const txParams = constructTxParams(opts);
      return dispatch(signTx(txParams));
    },
    update: (opts) => {
      const editingTx = constructUpdatedTx(opts);
      return dispatch(updateTransaction(editingTx));
    },
  };
}
