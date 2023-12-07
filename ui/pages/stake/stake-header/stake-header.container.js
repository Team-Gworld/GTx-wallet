import { connect } from 'react-redux';
import { clearSend } from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import StakeHeader from './stake-header.component';

export default connect(mapStateToProps, mapDispatchToProps)(StakeHeader);

function mapStateToProps(state) {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
  };
}
