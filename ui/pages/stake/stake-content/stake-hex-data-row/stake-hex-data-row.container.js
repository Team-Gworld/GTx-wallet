import { connect } from 'react-redux';
import { updateSendHexData } from '../../../../store/actions';
import StakeHexDataRow from './stake-hex-data-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(StakeHexDataRow);

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
