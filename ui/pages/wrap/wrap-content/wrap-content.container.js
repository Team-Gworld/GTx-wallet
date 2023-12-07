import { connect } from 'react-redux';
import {
  getSendAsset,
  getSendAmount,
  getSelectedNative,
  getCurrentNetwork,
  getSendHexDataFeatureFlagState,
} from '../../../selectors';
import { THETAMAINNET_NETWORK_ID } from '../../../../app/scripts/controllers/network/enums';
import WrapContent from './wrap-content.component';

function mapStateToProps(state) {
  const selectedNative = getSelectedNative(state);
  const network = getCurrentNetwork(state);
  return {
    sendAsset: getSendAsset(state),
    sendAmount: getSendAmount(state),
    showHexData:
      (!selectedNative || network !== THETAMAINNET_NETWORK_ID) &&
      getSendHexDataFeatureFlagState(state),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
  };
}

export default connect(mapStateToProps, undefined, mergeProps)(WrapContent);
