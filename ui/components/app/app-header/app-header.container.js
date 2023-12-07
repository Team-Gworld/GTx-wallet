import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { getSelectedNative } from '../../../selectors';
import * as actions from '../../../store/actions';
import AppHeader from './app-header.component';

const mapStateToProps = (state) => {
  const { appState, metamask } = state;
  const { networkDropdownOpen } = appState;
  const { network, provider, selectedAddress, isUnlocked } = metamask;

  return {
    networkDropdownOpen,
    network,
    provider,
    selectedNative: getSelectedNative(state),
    selectedAddress,
    isUnlocked,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AppHeader);
