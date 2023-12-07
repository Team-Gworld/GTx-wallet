import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { addHexPrefix } from 'ethereumjs-util';
import SendRowWrapper from '../send-row-wrapper';
import Identicon from '../../../../components/ui/identicon';
import TokenBalance from '../../../../components/ui/token-balance';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../helpers/constants/common';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';

export default class SendAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
        isERC721: PropTypes.bool,
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
    network: PropTypes.string.isRequired,
    isEditing: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isShowingDropdown: false,
    sendableTokens: [],
  };

  async componentDidMount() {
    const chainId = addHexPrefix(parseInt(this.props.network, 10).toString(16));
    const sendableTokens = this.props.tokens.filter(
      (token) => !token.isERC721 && token.chainId === chainId,
    );
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
      },
    );
  };

  render() {
    const { t } = this.context;
    const { isEditing } = this.props;

    return (
      <SendRowWrapper label={`${t('asset')}:`}>
        <div className="send-v2__asset-dropdown">
          {this.renderSendAsset()}
          {this.state.sendableTokens.length > 0 && !isEditing
            ? this.renderAssetDropdown()
            : null}
        </div>
      </SendRowWrapper>
    );
  }

  renderSendAsset() {
    const { sendAssetAddress, sendAssetType } = this.props;
    const token = this.props.tokens.find(
      ({ address }) => address === sendAssetAddress,
    );
    return (
      <div
        className="send-v2__asset-dropdown__input-wrapper"
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
    return (
      this.state.isShowingDropdown && (
        <div>
          <div
            className="send-v2__asset-dropdown__close-area"
            onClick={this.closeDropdown}
          />
          <div className="send-v2__asset-dropdown__list">
            {this.renderNativeCurrency(true, false)}
            {this.props.nativeCurrency2
              ? this.renderNativeCurrency(true, true)
              : ''}
            {this.props.nativeCurrency2
              ? ''
              : this.state.sendableTokens.map((token) =>
                  this.renderAsset(token, true),
                )}
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
      isEditing,
    } = this.props;

    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress][isNative2 ? 'balance2' : 'balance']
      : '';

    return (
      <div
        className={
          this.state.sendableTokens.length > 0
            ? 'send-v2__asset-dropdown__asset'
            : 'send-v2__asset-dropdown__single-asset'
        }
        onClick={() =>
          this.selectToken(isNative2 ? ASSET_TYPE.NATIVE2 : ASSET_TYPE.NATIVE)
        }
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon
            diameter={36}
            image={isNative2 ? nativeCurrency2Image : nativeCurrencyImage}
            address={isNative2 ? nativeCurrency2 : nativeCurrency}
          />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">
            {isNative2 ? nativeCurrency2 : nativeCurrency}
          </div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">{`${t(
              'balance',
            )}:`}</span>
            <UserPreferencedCurrencyDisplay
              value={balanceValue}
              type={PRIMARY}
              suffix={isNative2 ? nativeCurrency2 : undefined}
            />
          </div>
        </div>
        {!insideDropdown &&
          this.state.sendableTokens.length > 0 &&
          !isEditing && (
            <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
          )}
      </div>
    );
  }

  renderAsset(token, insideDropdown = false) {
    const { assetImages, isEditing } = this.props;
    const { address, symbol } = token;
    const { t } = this.context;

    return (
      <div
        key={address}
        className="send-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(ASSET_TYPE.TOKEN, token)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon
            address={address}
            diameter={36}
            image={assetImages?.[address]}
          />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">{symbol}</div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">{`${t(
              'balance',
            )}:`}</span>
            <TokenBalance token={token} />
          </div>
        </div>
        {!insideDropdown && !isEditing && (
          <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        )}
      </div>
    );
  }
}
