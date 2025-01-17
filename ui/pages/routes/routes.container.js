import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getNetworkIdentifier,
  hasPermissionRequests,
  getPreferences,
  submittedPendingTransactionsSelector,
  getSendEditingTransactionId,
} from '../../selectors';
import {
  hideSidebar,
  lockMetamask,
  setCurrentCurrency,
  setLastActiveTime,
  setMouseUserState,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { appState } = state;
  const { sidebar, alertOpen, alertMessage, isLoading, loadingMessage } =
    appState;
  const { autoLockTimeLimit = 0 } = getPreferences(state);
  const selectedNative = state.metamask.provider?.rpcPrefs?.selectedNative;

  return {
    sidebar,
    alertOpen,
    alertMessage,
    textDirection: state.metamask.textDirection,
    isLoading,
    isEditing: Boolean(getSendEditingTransactionId(state)),
    loadingMessage,
    isUnlocked: state.metamask.isUnlocked,
    submittedPendingTransactions: submittedPendingTransactionsSelector(state),
    network: state.metamask.network,
    provider: state.metamask.provider,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    providerId: getNetworkIdentifier(state),
    autoLockTimeLimit,
    hasPermissionsRequests: hasPermissionRequests(state),
    selectedNative,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    hideSidebar: () => dispatch(hideSidebar()),
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) =>
      dispatch(setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(setLastActiveTime()),
    pageChanged: (path) => dispatch(pageChanged(path)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Routes);
