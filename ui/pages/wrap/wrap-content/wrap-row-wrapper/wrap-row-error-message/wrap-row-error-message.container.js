import { connect } from 'react-redux';
import { getSendErrors } from '../../../../../selectors';
import WrapRowErrorMessage from './wrap-row-error-message.component';

export default connect(mapStateToProps)(WrapRowErrorMessage);

function mapStateToProps(state, ownProps) {
  return {
    errors: getSendErrors(state),
    errorType: ownProps.errorType,
  };
}
