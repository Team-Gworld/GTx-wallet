import { connect } from 'react-redux';
import {
  getSendAsset,
  getSendAmount,
  getSelectedNative,
  getCurrentNetwork,
  getSendHexDataFeatureFlagState,
  getSendFromObject,
} from '../../../selectors';
import { THETAMAINNET_NETWORK_ID } from '../../../../app/scripts/controllers/network/enums';
import {
  signTx,
  updateSendAmount,
  updateSendAsset,
  updateSendTo,
} from '../../../store/actions';
import { constructTxParams } from '../stake-footer/stake-footer.utils';
import StakeContent from './stake-content.component';

function mapStateToProps(state) {
  const selectedNative = getSelectedNative(state);
  const network = getCurrentNetwork(state);
  return {
    sendAsset: getSendAsset(state),
    sendAmount: getSendAmount(state),
    showHexData:
      (!selectedNative || network !== THETAMAINNET_NETWORK_ID) &&
      getSendHexDataFeatureFlagState(state),
    from: getSendFromObject(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: async (opts) => await dispatch(updateSendAsset(opts)),
    updateSendAmount: async (amount) =>
      await dispatch(updateSendAmount(amount)),
    updateSendTo: async (to, nickname) =>
      await dispatch(updateSendTo(to, nickname)),
    sign: (opts) => {
      const txParams = constructTxParams(opts);
      dispatch(signTx(txParams));
    },
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    updateSendAsset: dispatchProps.updateSendAsset,
    updateSendAmount: dispatchProps.updateSendAmount,
    updateSendTo: dispatchProps.updateSendTo,
    sign: dispatchProps.sign,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(StakeContent);
