import { connect } from 'react-redux';
import { updateSendHexData } from '../../../../store/actions';
import WrapHexDataRow from './wrap-hex-data-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(WrapHexDataRow);

function mapStateToProps(state) {
  return {
    data: state.metamask.send.data,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendHexData(data) {
      return dispatch(updateSendHexData(data));
    },
  };
}
