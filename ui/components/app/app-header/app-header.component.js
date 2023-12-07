import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../ui/identicon';
import MetaFoxLogo from '../../ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import NetworkIndicator from '../network';
import { networkColor } from '../../../../app/scripts/controllers/network/enums';

export default class AppHeader extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    network: PropTypes.string,
    selectedNative: PropTypes.bool,
    provider: PropTypes.object,
    networkDropdownOpen: PropTypes.bool,
    showNetworkDropdown: PropTypes.func,
    hideNetworkDropdown: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
    selectedAddress: PropTypes.string,
    isUnlocked: PropTypes.bool,
    hideNetworkIndicator: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleNetworkIndicatorClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const { networkDropdownOpen, showNetworkDropdown, hideNetworkDropdown } =
      this.props;

    if (networkDropdownOpen === false) {
      showNetworkDropdown();
    } else {
      hideNetworkDropdown();
    }
  }

  renderAccountMenu() {
    const { isUnlocked, toggleAccountMenu, selectedAddress, disabled } =
      this.props;

    return (
      isUnlocked && (
        <div
          className={classnames('account-menu__icon', {
            'account-menu__icon--disabled': disabled,
          })}
          onClick={() => {
            if (!disabled) {
              toggleAccountMenu();
            }
          }}
        >
          <Identicon address={selectedAddress} diameter={32} addBorder />
        </div>
      )
    );
  }

  render() {
    const {
      history,
      network,
      provider,
      isUnlocked,
      hideNetworkIndicator,
      disabled,
      selectedNative,
    } = this.props;
    const netColor = networkColor(network, selectedNative);

    return (
      <div
        className={classnames('app-header', {
          'app-header--back-drop': isUnlocked,
        })}
        style={{ backgroundColor: netColor }}
      >
        <div className="app-header__contents">
          <MetaFoxLogo
            unsetIconHeight
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          <div className="app-header__account-menu-container">
            {!hideNetworkIndicator && (
              <div className="app-header__network-component-wrapper">
                <NetworkIndicator
                  network={network}
                  provider={provider}
                  onClick={(event) => this.handleNetworkIndicatorClick(event)}
                  disabled={disabled}
                />
              </div>
            )}
            {this.renderAccountMenu()}
          </div>
        </div>
      </div>
    );
  }
}
