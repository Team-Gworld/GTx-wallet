import { connect } from 'react-redux';
import { getOnboardingInitiator } from '../../../selectors';
import EndOfFlow from './end-of-flow.component';

const mapStateToProps = (state) => {
  return {
    onboardingInitiator: getOnboardingInitiator(state),
  };
};

export default connect(mapStateToProps)(EndOfFlow);
