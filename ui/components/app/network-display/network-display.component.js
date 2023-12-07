import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  MAINNET_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  KOVAN_NETWORK_ID,
  GOERLI_NETWORK_ID,
  THETAMAINNET_NETWORK_ID,
  THETAMAINNET_DISPLAY_NAME,
  THETASC_DISPLAY_NAME,
  networkColorName,
} from '../../../../app/scripts/controllers/network/enums';
import { getSelectedNative } from '../../../selectors';

const networkIdToTypeMap = {
  [MAINNET_NETWORK_ID]: 'mainnet',
  [THETAMAINNET_NETWORK_ID]: 'theta_mainnet',
  [ROPSTEN_NETWORK_ID]: 'ropsten',
  [RINKEBY_NETWORK_ID]: 'rinkeby',
  [GOERLI_NETWORK_ID]: 'goerli',
  [KOVAN_NETWORK_ID]: 'kovan',
};

export default class NetworkDisplay extends Component {
  static defaultProps = {
    colored: true,
  };

  static propTypes = {
    colored: PropTypes.bool,
    network: PropTypes.string,
    provider: PropTypes.object,
    selectedNative: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const {
      colored,
      network,
      provider: { type, nickname },
      selectedNative,
    } = this.props;
    const networkClassName = networkColorName(network, selectedNative);

    return (
      <div
        className={classnames('network-display__container', {
          'network-display__container--colored': colored,
          [`network-display__container--${networkClassName}`]:
            colored && networkClassName,
        })}
      >
        {networkClassName ? (
          <div
            className={`network-display__icon network-display__icon--${networkClassName}`}
          />
        ) : (
          <div
            className="i fa fa-question-circle fa-med"
            style={{
              margin: '0 4px',
              color: 'rgb(125, 128, 130)',
            }}
          />
        )}
        <div className="network-display__name">
          {network === THETAMAINNET_NETWORK_ID
            ? this.context.t(networkClassName)
            : (type === 'rpc' && nickname) || this.context.t(type)}
        </div>
      </div>
    );
  }
}
