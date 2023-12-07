import { connect } from 'react-redux';
import { getIpfsGateway } from '../../../selectors';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const { tokens } = state.metamask;
  return {
    tokens,
    ipfsGateway: getIpfsGateway(state),
  };
};

export default connect(mapStateToProps)(TokenList);
