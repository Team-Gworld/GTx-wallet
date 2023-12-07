import { connect } from 'react-redux';
import NetworkDisplay from './network-display.component';

const mapStateToProps = ({ metamask: { network, provider } }) => {
  const { selectedNative } = provider?.rpcPrefs || {};
  return {
    network,
    provider,
    selectedNative,
  };
};

export default connect(mapStateToProps)(NetworkDisplay);
