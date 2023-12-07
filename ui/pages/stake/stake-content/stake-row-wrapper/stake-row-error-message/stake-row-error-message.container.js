import { connect } from 'react-redux';
import { getSendErrors } from '../../../../../selectors';
import StakeRowErrorMessage from './stake-row-error-message.component';

export default connect(mapStateToProps)(StakeRowErrorMessage);

function mapStateToProps(state, ownProps) {
  return {
    errors: getSendErrors(state),
    errorType: ownProps.errorType,
  };
}
