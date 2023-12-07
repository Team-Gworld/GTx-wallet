import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setAutoLockTimeLimit,
  setUseNonceField,
  setIpfsGateway,
  backupData,
  restoreData,
} from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import AdvancedTab from './advanced-tab.component';

export const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { sendHexData, advancedInlineGas } = {},
    useNonceField,
    ipfsGateway,
  } = metamask;
  const { showFiatInTestnets, autoLockTimeLimit } = getPreferences(state);

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    showFiatInTestnets,
    autoLockTimeLimit,
    useNonceField,
    ipfsGateway,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    setHexDataFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setAdvancedInlineGasFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
    setUseNonceField: (value) => dispatch(setUseNonceField(value)),
    setShowFiatConversionOnTestnetsPreference: (value) => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value));
    },
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value));
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value));
    },
    backupData: () => dispatch(backupData()),
    restoreData: (json) => dispatch(restoreData(json)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AdvancedTab);
