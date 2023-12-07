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
  getSendTo,
  getSendHexData,
  getTokenBalance,
  getUnapprovedTxs,
  isSendFormInError,
  getGasIsLoading,
} from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import StakeFooter from './stake-footer.component';
import { constructTxParams, constructUpdatedTx } from './stake-footer.utils';

export default connect(mapStateToProps, mapDispatchToProps)(StakeFooter);

function mapStateToProps(state) {
  const editingTransactionId = getSendEditingTransactionId(state);

  return {
    amount: getSendAmount(state),
    data: getSendHexData(state),
    editingTransactionId,
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPriceParams: getGasPriceParams(state),
    gasTotal: getGasTotal(state),
    inError: isSendFormInError(state),
    sendAsset: getSendAsset(state),
    to: getSendTo(state),
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
      dispatch(signTx(txParams));
    },
    update: (opts) => {
      const editingTx = constructUpdatedTx(opts);
      return dispatch(updateTransaction(editingTx));
    },
  };
}
