import { connect } from 'react-redux';

import { setPendingTokens, clearPendingTokens } from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getCurrentChainId } from '../../selectors';
import AddToken from './add-token.component';

const mapStateToProps = (state) => {
  const {
    metamask: { identities, tokens, pendingTokens },
  } = state;
  return {
    identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    tokens,
    pendingTokens,
    chainId: getCurrentChainId(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setPendingTokens: (tokens) => dispatch(setPendingTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AddToken);
