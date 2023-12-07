import { connect } from 'react-redux';
import {
  getConversionRate,
  getGasTotal,
  getPrimaryCurrency,
  getSendAsset,
  getSendAmount,
  getSendFromBalance,
  getTokenBalance,
  getSendMaxModeState,
  sendAmountIsInError,
  getSendFromBalance2,
} from '../../../../selectors';
import { getAmountErrorObject, getGasFeeErrorObject } from '../../send.utils';
import { setMaxModeTo, updateSendAmount } from '../../../../store/actions';
import { updateSendErrors } from '../../../../ducks/send/send.duck';
import SendAmountRow from './send-amount-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow);

function mapStateToProps(state) {
  return {
    amount: getSendAmount(state),
    balance: getSendFromBalance(state),
    balance2: getSendFromBalance2(state),
    conversionRate: getConversionRate(state),
    gasTotal: getGasTotal(state),
    inError: sendAmountIsInError(state),
    primaryCurrency: getPrimaryCurrency(state),
    sendAsset: getSendAsset(state),
    tokenBalance: getTokenBalance(state),
    maxModeOn: getSendMaxModeState(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setMaxModeTo: (bool) => dispatch(setMaxModeTo(bool)),
    updateSendAmount: (newAmount) => dispatch(updateSendAmount(newAmount)),
    updateGasFeeError: (amountDataObject) => {
      dispatch(updateSendErrors(getGasFeeErrorObject(amountDataObject)));
    },
    updateSendAmountError: (amountDataObject) => {
      dispatch(updateSendErrors(getAmountErrorObject(amountDataObject)));
    },
  };
}
