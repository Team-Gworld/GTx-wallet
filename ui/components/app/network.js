import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import {
  MAINNET,
  MAINNET_COLOR,
  MAINNET_COLOR_DARK,
  THETAMAINNET,
  THETAMAINNET_DISPLAY_NAME,
  THETA_NATIVE_COLOR,
  THETA_NATIVE_COLOR_DARK,
  THETASC,
  THETASC_DISPLAY_NAME,
  THETA_SC_COLOR,
  THETA_SC_COLOR_DARK,
} from '../../../app/scripts/controllers/network/enums';
import NetworkDropdownIcon from './dropdowns/components/network-dropdown-icon';

function NetworkIndicator({
  disabled,
  children,
  hoverText,
  onClick,
  providerName,
}) {
  return (
    <div
      className={classnames('network-component pointer', {
        'network-component--disabled': disabled,
        'ethereum-network': providerName === 'mainnet',
        'ropsten-test-network': providerName === 'ropsten',
        'kovan-test-network': providerName === 'kovan',
        'rinkeby-test-network': providerName === 'rinkeby',
        'goerli-test-network': providerName === 'goerli',
      })}
      title={hoverText}
      onClick={(event) => {
        if (!disabled) {
          onClick(event);
        }
      }}
    >
      <div className="network-indicator">
        {children}
        <div className="network-indicator__down-arrow" />
      </div>
    </div>
  );
}

NetworkIndicator.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  hoverText: PropTypes.string,
  onClick: PropTypes.func,
  providerName: PropTypes.string,
};

export default class Network extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    network: PropTypes.string.isRequired,
    provider: PropTypes.shape({
      type: PropTypes.string,
      nickname: PropTypes.string,
      rpcTarget: PropTypes.string,
    }).isRequired,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
  };

  render() {
    const { t } = this.context;

    const { disabled, network: networkNumber, onClick, provider } = this.props;

    let providerName, providerNick, providerUrl;
    if (provider) {
      providerName = provider.type;
      providerNick = provider.nickname || '';
      providerUrl = provider.rpcTarget;
    }

    switch (providerName === 'rpc' ? providerNick : providerName) {
      case MAINNET:
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t(MAINNET)}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor={MAINNET_COLOR}
              nonSelectBackgroundColor={MAINNET_COLOR_DARK}
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t(MAINNET)}</div>
          </NetworkIndicator>
        );
      case THETASC_DISPLAY_NAME:
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t(THETASC)}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor={THETA_SC_COLOR}
              nonSelectBackgroundColor={THETA_SC_COLOR_DARK}
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t(THETASC)}</div>
          </NetworkIndicator>
        );
      case THETAMAINNET_DISPLAY_NAME:
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t(THETAMAINNET)}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor={THETA_NATIVE_COLOR}
              nonSelectBackgroundColor={THETA_NATIVE_COLOR_DARK}
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t(THETAMAINNET)}</div>
          </NetworkIndicator>
        );
      case 'ropsten':
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t('ropsten')}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor="#e91550"
              nonSelectBackgroundColor="#ec2c50"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('ropsten')}</div>
          </NetworkIndicator>
        );

      case 'kovan':
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t('kovan')}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor="#690496"
              nonSelectBackgroundColor="#b039f3"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('kovan')}</div>
          </NetworkIndicator>
        );

      case 'rinkeby':
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t('rinkeby')}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor="#ebb33f"
              nonSelectBackgroundColor="#ecb23e"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('rinkeby')}</div>
          </NetworkIndicator>
        );

      case 'goerli':
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={t('goerli')}
            onClick={onClick}
            providerName={providerName}
          >
            <NetworkDropdownIcon
              backgroundColor="#3099f2"
              nonSelectBackgroundColor="#ecb23e"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('goerli')}</div>
          </NetworkIndicator>
        );

      default:
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={providerNick || providerName || providerUrl || null}
            onClick={onClick}
            providerName={providerName}
          >
            {networkNumber === 'loading' ? (
              <span
                className="pointer network-loading-spinner"
                onClick={(event) => onClick(event)}
              >
                <img
                  title={t('attemptingConnect')}
                  src="images/loading.svg"
                  alt=""
                />
              </span>
            ) : (
              <i
                className="fa fa-question-circle fa-lg"
                style={{ color: 'rgb(125, 128, 130)' }}
              />
            )}
            <div className="network-name">
              {providerName === 'localhost'
                ? t('localhost')
                : providerNick || t('privateNetwork')}
            </div>
          </NetworkIndicator>
        );
    }
  }
}
