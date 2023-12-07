import React, { Component } from 'react';
import PropTypes from 'prop-types';
import WrapRowWrapper from '../wrap-row-wrapper';
import Identicon from '../../../../components/ui/identicon';
import TokenBalance from '../../../../components/ui/token-balance';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../helpers/constants/common';
import { WRAP_ROUTE } from '../../../../helpers/constants/routes';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import * as theta from '../../../../../shared/constants/theta';

export default class WrapAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
      }),
    ).isRequired,
    assetImages: PropTypes.object.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
    nativeCurrencyImage: PropTypes.string.isRequired,
    nativeCurrency2: PropTypes.string,
    nativeCurrency2Image: PropTypes.string,
    accounts: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    sendAssetAddress: PropTypes.string,
    sendAssetType: PropTypes.string,
    setSendAsset: PropTypes.func.isRequired,
    history: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isShowingDropdown: false,
    sendableTokens: [],
  };

  async componentDidMount() {
    const sendableTokens = this.props.tokens.filter((token) => !token.isERC721);
    this.setState({ sendableTokens });
  }

  openDropdown = () => this.setState({ isShowingDropdown: true });

  closeDropdown = () => this.setState({ isShowingDropdown: false });

  selectToken = (type, token) => {
    this.setState(
      {
        isShowingDropdown: false,
      },
      () => {
        this.props.setSendAsset(
          type,
          [ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(type)
            ? undefined
            : token,
        );
        if (this.props.history.location.pathname !== WRAP_ROUTE) {
          this.props.history.push(WRAP_ROUTE);
        }
      },
    );
  };

  render() {
    const { t } = this.context;

    return (
      <WrapRowWrapper label={`${t('asset')}:`}>
        <div className="wrap-v2__asset-dropdown">
          {this.renderSendAsset()}
          {this.state.sendableTokens.length > 0
            ? this.renderAssetDropdown()
            : null}
        </div>
      </WrapRowWrapper>
    );
  }

  renderSendAsset() {
    const { sendAssetAddress, sendAssetType } = this.props;
    const token = this.props.tokens.find(
      ({ address }) => address === sendAssetAddress,
    );

    return (
      <div
        className="wrap-v2__asset-dropdown__input-wrapper"
        onClick={this.openDropdown}
      >
        {token
          ? this.renderAsset(token)
          : this.renderNativeCurrency(
              false,
              sendAssetType === ASSET_TYPE.NATIVE2,
            )}
      </div>
    );
  }

  renderAssetDropdown() {
    const { sendAssetType } = this.props;
    const isToken = sendAssetType === ASSET_TYPE.TOKEN;
    return (
      this.state.isShowingDropdown && (
        <div>
          <div
            className="wrap-v2__asset-dropdown__close-area"
            onClick={this.closeDropdown}
          />
          <div className="wrap-v2__asset-dropdown__list">
            {!isToken && this.renderNativeCurrency(true, false)}
            {!isToken &&
              this.props.nativeCurrency2 &&
              this.renderNativeCurrency(true, true)}
            {isToken &&
              this.state.sendableTokens
                .filter((t) =>
                  Object.values(theta.contracts).includes(t.address),
                )
                .map((token) => this.renderAsset(token, true))}
          </div>
        </div>
      )
    );
  }

  renderNativeCurrency(insideDropdown = false, isNative2 = false) {
    const { t } = this.context;
    const {
      accounts,
      selectedAddress,
      nativeCurrency,
      nativeCurrencyImage,
      nativeCurrency2,
      nativeCurrency2Image,
    } = this.props;

    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress][isNative2 ? 'balance2' : 'balance']
      : '';

    return (
      <div
        className={
          this.state.sendableTokens.length > 0
            ? 'wrap-v2__asset-dropdown__asset'
            : 'wrap-v2__asset-dropdown__single-asset'
        }
        onClick={() =>
          this.selectToken(isNative2 ? ASSET_TYPE.NATIVE2 : ASSET_TYPE.NATIVE)
        }
      >
        <div className="wrap-v2__asset-dropdown__asset-icon">
          <Identicon
            diameter={36}
            image={isNative2 ? nativeCurrency2Image : nativeCurrencyImage}
            address={isNative2 ? nativeCurrency2 : nativeCurrency}
          />
        </div>
        <div className="wrap-v2__asset-dropdown__asset-data">
          <div className="wrap-v2__asset-dropdown__symbol">
            {isNative2 ? nativeCurrency2 : nativeCurrency}
          </div>
          <div className="wrap-v2__asset-dropdown__name">
            <span className="wrap-v2__asset-dropdown__name__label">{`${t(
              'balance',
            )}:`}</span>
            <UserPreferencedCurrencyDisplay
              value={balanceValue}
              type={PRIMARY}
              suffix={isNative2 ? nativeCurrency2 : undefined}
            />
          </div>
        </div>
        {!insideDropdown && this.state.sendableTokens.length > 0 && (
          <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        )}
      </div>
    );
  }

  renderAsset(token, insideDropdown = false) {
    const { assetImages } = this.props;
    const { address, symbol } = token;
    const { t } = this.context;

    return (
      <div
        key={address}
        className="wrap-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(ASSET_TYPE.TOKEN, token)}
      >
        <div className="wrap-v2__asset-dropdown__asset-icon">
          <Identicon
            address={address}
            diameter={36}
            image={assetImages?.[address]}
          />
        </div>
        <div className="wrap-v2__asset-dropdown__asset-data">
          <div className="wrap-v2__asset-dropdown__symbol">{symbol}</div>
          <div className="wrap-v2__asset-dropdown__name">
            <span className="wrap-v2__asset-dropdown__name__label">{`${t(
              'balance',
            )}:`}</span>
            <TokenBalance token={token} />
          </div>
        </div>
        {!insideDropdown && (
          <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        )}
      </div>
    );
  }
}
