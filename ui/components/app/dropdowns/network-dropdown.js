import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import * as actions from '../../../store/actions';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { defaultNetworksData } from '../../../pages/settings/networks-tab/networks-tab.constants';
import {
  THETAMAINNET_CHAIN_ID,
  THETAMAINNET_DISPLAY_NAME,
  THETAMAINNET_NETWORK_ID,
  THETASC_DISPLAY_NAME,
  THETA_NATIVE_COLOR,
  THETA_SC_COLOR,
} from '../../../../app/scripts/controllers/network/enums';
import { Dropdown, DropdownMenuItem } from './components/dropdown';
import NetworkDropdownIcon from './components/network-dropdown-icon';

// classes from nodes of the toggle element.
const notToggleElementClassnames = [
  'menu-icon',
  'network-name',
  'network-indicator',
  'network-caret',
  'network-component',
];

function mapStateToProps(state) {
  return {
    provider: state.metamask.provider,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    networkDropdownOpen: state.appState.networkDropdownOpen,
    network: state.metamask.network,
    selectedNative: state.metamask.provider.rpcPrefs?.selectedNative,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type));
    },
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    setRpcTarget: (target, networkId, ticker, nickname, rpcPrefs) => {
      dispatch(
        actions.setRpcTarget(target, networkId, ticker, nickname, rpcPrefs),
      );
    },
    delRpcTarget: (target) => {
      dispatch(actions.delRpcTarget(target));
    },
    setNetworksTabAddMode: (isInAddMode) =>
      dispatch(actions.setNetworksTabAddMode(isInAddMode)),
  };
}

class NetworkDropdown extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    provider: PropTypes.shape({
      nickname: PropTypes.string,
      rpcTarget: PropTypes.string,
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
    setProviderType: PropTypes.func.isRequired,
    network: PropTypes.string.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    hideNetworkDropdown: PropTypes.func.isRequired,
    setNetworksTabAddMode: PropTypes.func.isRequired,
    frequentRpcListDetail: PropTypes.array.isRequired,
    networkDropdownOpen: PropTypes.bool.isRequired,
    history: PropTypes.object.isRequired,
    delRpcTarget: PropTypes.func.isRequired,
    selectedNative: PropTypes.bool,
  };

  handleClick(newProviderType) {
    const { setProviderType } = this.props;
    setProviderType(newProviderType);
  }

  renderCustomOption(provider) {
    const { rpcTarget, type, ticker, nickname, rpcPrefs } = provider;
    const { network } = this.props;

    if (type !== 'rpc') {
      return null;
    }
    const thetaNet = defaultNetworksData.find(
      (e) => e.labelKey === 'theta_mainnet',
    );

    switch (rpcTarget) {
      case 'http://localhost:8545':
      case thetaNet.rpcUrl:
        return null;

      default:
        return (
          <DropdownMenuItem
            key={rpcTarget}
            onClick={() =>
              this.props.setRpcTarget(
                rpcTarget,
                network,
                ticker,
                nickname,
                rpcPrefs,
              )
            }
            closeMenu={() => this.props.hideNetworkDropdown()}
            style={{
              fontSize: '16px',
              lineHeight: '20px',
              padding: '12px 0',
            }}
          >
            <i className="fa fa-check" />
            <i className="fa fa-question-circle fa-med menu-icon-circle" />
            <span
              className="network-name-item"
              style={{
                color: '#ffffff',
              }}
            >
              {nickname || rpcTarget}
            </span>
          </DropdownMenuItem>
        );
    }
  }

  renderCommonRpc(rpcListDetail, provider) {
    const reversedRpcListDetail = rpcListDetail.slice().reverse();

    return reversedRpcListDetail.map((entry) => {
      const {
        rpcUrl: rpc,
        chainId,
        ticker = 'ETH',
        nickname = '',
        rpcPrefs = {},
      } = entry;
      const currentRpcTarget =
        provider.type === 'rpc' && rpc === provider.rpcTarget;
      if (
        chainId === THETAMAINNET_CHAIN_ID ||
        chainId === THETAMAINNET_NETWORK_ID ||
        rpc === 'http://localhost:8545' ||
        currentRpcTarget
      ) {
        return null;
      }
      return (
        <DropdownMenuItem
          key={`common${rpc}`}
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() =>
            this.props.setRpcTarget(rpc, chainId, ticker, nickname, rpcPrefs)
          }
          style={{
            fontSize: '16px',
            lineHeight: '20px',
            padding: '12px 0',
          }}
        >
          {currentRpcTarget ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <i className="fa fa-question-circle fa-med menu-icon-circle" />
          <span
            className="network-name-item"
            style={{
              color: currentRpcTarget ? '#ffffff' : '#9b9b9b',
            }}
          >
            {nickname || rpc}
          </span>
          <i
            className="fa fa-times delete"
            onClick={(e) => {
              e.stopPropagation();
              this.props.delRpcTarget(rpc);
            }}
          />
        </DropdownMenuItem>
      );
    });
  }

  getNetworkName() {
    const { provider } = this.props;
    const providerName = provider.type;

    let name;

    if (providerName === 'mainnet') {
      name = this.context.t('mainnet');
    } else if (providerName === 'ropsten') {
      name = this.context.t('ropsten');
    } else if (providerName === 'kovan') {
      name = this.context.t('kovan');
    } else if (providerName === 'rinkeby') {
      name = this.context.t('rinkeby');
    } else if (providerName === 'localhost') {
      name = this.context.t('localhost');
    } else if (providerName === 'goerli') {
      name = this.context.t('goerli');
    } else if (providerName === 'theta_mainnet') {
      name = this.context.t('theta_mainnet');
    } else if (providerName === 'theta_sc') {
      name = this.context.t('theta_sc');
    } else {
      name = provider.nickname || this.context.t('unknownNetwork');
    }

    return name;
  }

  render() {
    const {
      provider: { type: providerType, rpcTarget: activeNetwork } = {},
      setNetworksTabAddMode,
      selectedNative,
    } = this.props;
    const rpcListDetail = this.props.frequentRpcListDetail;
    const isOpen = this.props.networkDropdownOpen;
    const dropdownMenuItemStyle = {
      fontSize: '16px',
      lineHeight: '20px',
      padding: '12px 0',
    };

    const thetaNet = defaultNetworksData.find(
      (e) => e.labelKey === 'theta_mainnet',
    );
    const onTheta =
      providerType === thetaNet.providerType &&
      activeNetwork === thetaNet.rpcUrl;

    return (
      <Dropdown
        isOpen={isOpen}
        onClickOutside={(event) => {
          const { classList } = event.target;
          const isInClassList = (className) => classList.contains(className);
          const notToggleElementIndex =
            notToggleElementClassnames.findIndex(isInClassList);

          if (notToggleElementIndex === -1) {
            this.props.hideNetworkDropdown();
          }
        }}
        containerClassName="network-droppo"
        zIndex={55}
        style={{
          position: 'absolute',
          top: '58px',
          width: '309px',
          zIndex: '55px',
        }}
        innerStyle={{
          padding: '18px 8px',
        }}
      >
        <div className="network-dropdown-header">
          <div className="network-dropdown-title">
            {this.context.t('networks')}
          </div>
          <div className="network-dropdown-divider" />
          <div className="network-dropdown-content">
            {this.context.t('defaultNetwork')}
          </div>
        </div>

        <DropdownMenuItem
          key="theta_mainnet"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => {
            // this.handleClick('theta_mainnet')
            this.props.setRpcTarget(
              thetaNet.rpcUrl,
              thetaNet.chainId,
              thetaNet.ticker,
              THETAMAINNET_DISPLAY_NAME,
              {
                blockExplorerUrl: thetaNet.blockExplorerUrl,
                selectedNative: true,
              },
            );
          }}
          style={{ ...dropdownMenuItemStyle, borderColor: '#038789' }}
        >
          {onTheta && selectedNative ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            backgroundColor={THETA_NATIVE_COLOR}
            isSelected={onTheta}
          />
          <span
            className="network-name-item"
            style={{
              color: onTheta ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('theta_mainnet')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="theta_sc"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => {
            // this.handleClick('theta_sc')
            this.props.setRpcTarget(
              thetaNet.rpcUrl,
              thetaNet.chainId,
              thetaNet.ticker,
              THETASC_DISPLAY_NAME,
              {
                blockExplorerUrl: thetaNet.blockExplorerUrl,
                selectedNative: false,
              },
            );
          }}
          style={{ ...dropdownMenuItemStyle, borderColor: '#038789' }}
        >
          {onTheta && !selectedNative ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            backgroundColor={THETA_SC_COLOR}
            isSelected={onTheta}
          />
          <span
            className="network-name-item"
            style={{
              color: onTheta ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('theta_mainnet')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="main"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('mainnet')}
          style={{ ...dropdownMenuItemStyle, borderColor: '#038789' }}
        >
          {providerType === 'mainnet' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            backgroundColor="#454a75"
            isSelected={providerType === 'mainnet'}
          />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'mainnet' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('mainnet')}
          </span>
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          key="ropsten"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('ropsten')}
          style={dropdownMenuItemStyle}
        >
          {
            providerType === 'ropsten'
              ? <i className="fa fa-check" />
              : <div className="network-check__transparent">✓</div>
          }
          <NetworkDropdownIcon backgroundColor="#ff4a8d" isSelected={providerType === 'ropsten'} />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'ropsten'
                ? '#ffffff'
                : '#9b9b9b',
            }}
          >
            {this.context.t('ropsten')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="kovan"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('kovan')}
          style={dropdownMenuItemStyle}
        >
          {
            providerType === 'kovan'
              ? <i className="fa fa-check" />
              : <div className="network-check__transparent">✓</div>
          }
          <NetworkDropdownIcon backgroundColor="#7057ff" isSelected={providerType === 'kovan'} />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'kovan'
                ? '#ffffff'
                : '#9b9b9b',
            }}
          >
            {this.context.t('kovan')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="rinkeby"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('rinkeby')}
          style={dropdownMenuItemStyle}
        >
          {
            providerType === 'rinkeby'
              ? <i className="fa fa-check" />
              : <div className="network-check__transparent">✓</div>
          }
          <NetworkDropdownIcon backgroundColor="#f6c343" isSelected={providerType === 'rinkeby'} />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'rinkeby'
                ? '#ffffff'
                : '#9b9b9b',
            }}
          >
            {this.context.t('rinkeby')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="goerli"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('goerli')}
          style={dropdownMenuItemStyle}
        >
          {
            providerType === 'goerli'
              ? <i className="fa fa-check" />
              : <div className="network-check__transparent">✓</div>
          }
          <NetworkDropdownIcon backgroundColor="#3099f2" isSelected={providerType === 'goerli'} />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'goerli'
                ? '#ffffff'
                : '#9b9b9b',
            }}
          >
            {this.context.t('goerli')}
          </span>
        </DropdownMenuItem> */}
        <DropdownMenuItem
          key="default"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('localhost')}
          style={dropdownMenuItemStyle}
        >
          {providerType === 'localhost' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            isSelected={providerType === 'localhost'}
            innerBorder="1px solid #9b9b9b"
          />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'localhost' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('localhost')}
          </span>
        </DropdownMenuItem>
        {this.renderCustomOption(this.props.provider)}
        {this.renderCommonRpc(rpcListDetail, this.props.provider)}

        <DropdownMenuItem
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => {
            setNetworksTabAddMode(true);
            this.props.history.push(NETWORKS_ROUTE);
          }}
          style={dropdownMenuItemStyle}
        >
          {activeNetwork === 'custom' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            isSelected={activeNetwork === 'custom'}
            innerBorder="1px solid #9b9b9b"
          />
          <span
            className="network-name-item"
            style={{
              color: activeNetwork === 'custom' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('customRPC')}
          </span>
        </DropdownMenuItem>
      </Dropdown>
    );
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(NetworkDropdown);
