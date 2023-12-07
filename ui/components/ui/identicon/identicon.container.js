import { connect } from 'react-redux';
import { getIpfsGateway } from '../../../selectors';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, network },
  } = state;

  return {
    useBlockie,
    network,
    ipfsGateway: getIpfsGateway(state),
  };
};

export default connect(mapStateToProps)(Identicon);
