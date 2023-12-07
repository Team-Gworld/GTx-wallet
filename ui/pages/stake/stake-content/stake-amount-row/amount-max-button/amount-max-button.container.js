import { connect } from 'react-redux';
import {
  getGasTotal,
  getSendAsset,
  getSendFromBalance,
  getSendFromBalance2,
  getTokenBalance,
  getSendMaxModeState,
  getBasicGasEstimateLoadingStatus,
} from '../../../../../selectors';
import { updateSendAmount, setMaxModeTo } from '../../../../../store/actions';
import { updateSendErrors } from '../../../../../ducks/send/send.duck';
import { calcMaxAmount } from '../../../../send/send-content/send-amount-row/amount-max-button/amount-max-button.utils';
import AmountMaxButton from './amount-max-button.component';

export default connect(mapStateToProps, mapDispatchToProps)(AmountMaxButton);

function mapStateToProps(state) {
  return {
    balance: getSendFromBalance(state),
    balance2: getSendFromBalance2(state),
    buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
    gasTotal: getGasTotal(state),
    maxModeOn: getSendMaxModeState(state),
    sendAsset: getSendAsset(state),
    tokenBalance: getTokenBalance(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }));
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)));
    },
    clearMaxAmount: () => {
      dispatch(updateSendAmount('0'));
    },
    setMaxModeTo: (bool) => dispatch(setMaxModeTo(bool)),
  };
}
