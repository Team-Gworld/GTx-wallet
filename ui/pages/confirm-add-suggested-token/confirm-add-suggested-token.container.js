import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { addToken, removeSuggestedTokens } from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component';

const mapStateToProps = (state) => {
  const {
    metamask: { pendingTokens, suggestedTokens, tokens },
  } = state;
  const params = { ...pendingTokens, ...suggestedTokens };

  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    pendingTokens: params,
    tokens,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addToken: ({ address, symbol, decimals, image, logo }) =>
      dispatch(addToken(address, symbol, Number(decimals), image ?? logo)),
    removeSuggestedTokens: () => dispatch(removeSuggestedTokens()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmAddSuggestedToken);
