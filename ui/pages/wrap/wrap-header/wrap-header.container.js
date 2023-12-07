import { connect } from 'react-redux';
import { clearSend } from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import WrapHeader from './wrap-header.component';

export default connect(mapStateToProps, mapDispatchToProps)(WrapHeader);

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
