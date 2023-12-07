import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StakeRowWrapper from '../stake-row-wrapper';
import Identicon from '../../../../components/ui/identicon';
import TokenBalance from '../../../../components/ui/token-balance';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../helpers/constants/common';
import { STAKE_ROUTE } from '../../../../helpers/constants/routes';
import { getDefaultPurpose } from '../../stake.utils';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../../shared/constants/transaction';

export default class StakeAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
        staking: PropTypes.object,
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
    sendAssetMode: PropTypes.string,
    sendAssetStake: PropTypes.object,
    setSendAsset: PropTypes.func.isRequired,
    history: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isShowingDropdown: false,
    stakableTokens: [],
  };

  async componentDidMount() {
    const stakableTokens = this.props.tokens.filter((token) => token.staking);
    this.setState({ stakableTokens });
  }

  openDropdown = () => this.setState({ isShowingDropdown: true });

  closeDropdown = () => this.setState({ isShowingDropdown: false });

  selectToken = (type, token) => {
    const { sendAssetMode, history } = this.props;
    if (sendAssetMode === ASSET_MODE.UNSTAKE) {
      return;
    }

    this.setState(
      {
        isShowingDropdown: false,
      },
      () => {
        const {
          sendAssetType: prevType,
          sendAssetAddress: prevAddress,
          sendAssetStake,
        } = this.props;
        const prevToken = this.props.tokens.find(
          ({ address }) => address === prevAddress,
        );
        const useSendAssetStake = { ...sendAssetStake };
        if (type !== prevType || token !== prevToken) {
          useSendAssetStake.purpose = getDefaultPurpose(type);
        }

        this.props.setSendAsset(
          type,
          [ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(type)
            ? undefined
            : token,
          sendAssetMode,
          useSendAssetStake,
        );
        if (history.location.pathname !== STAKE_ROUTE) {
          history.push(STAKE_ROUTE);
        }
      },
    );
  };

  render() {
    const { t } = this.context;

    return (
      <StakeRowWrapper label={`${t('asset')}:`}>
        <div className="wrap-v2__asset-dropdown">
          {this.renderSendAsset()}
          {this.state.stakableTokens.length > 0
            ? this.renderAssetDropdown()
            : null}
        </div>
      </StakeRowWrapper>
    );
  }

  renderSendAsset() {
    const { sendAssetAddress, sendAssetType, sendAssetMode } = this.props;
    let token = this.props.tokens.find(
      ({ address }) => address === sendAssetAddress,
    );
    if (
      sendAssetMode === ASSET_MODE.UNSTAKE &&
      sendAssetType === ASSET_TYPE.TOKEN &&
      token?.staking?.functionSigs?.unstakeShares
    ) {
      const stakingToken = this.props.tokens.find(
        ({ address }) =>
          address === token.staking.stakingAddress?.toLowerCase(),
      );
      token = stakingToken;
    }
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
    const { sendAssetMode } = this.props;
    const hideNatives = sendAssetMode === ASSET_MODE.UNSTAKE;
    return (
      sendAssetMode !== ASSET_MODE.UNSTAKE &&
      this.state.isShowingDropdown && (
        <div>
          <div
            className="wrap-v2__asset-dropdown__close-area"
            onClick={this.closeDropdown}
          />
          <div className="wrap-v2__asset-dropdown__list">
            {!hideNatives && this.renderNativeCurrency(true, false)}
            {!hideNatives &&
              this.props.nativeCurrency2 &&
              this.renderNativeCurrency(true, true)}
            {this.state.stakableTokens.map((token) =>
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
      sendAssetMode,
    } = this.props;

    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress][isNative2 ? 'balance2' : 'balance']
      : '';

    return (
      <div
        className={
          this.state.stakableTokens.length > 0
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
        {!insideDropdown &&
          this.state.stakableTokens.length > 0 &&
          sendAssetMode !== ASSET_MODE.UNSTAKE && (
            <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
          )}
      </div>
    );
  }

  renderAsset(token, insideDropdown = false) {
    const { assetImages, sendAssetMode } = this.props;
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
        {!insideDropdown && sendAssetMode !== ASSET_MODE.UNSTAKE && (
          <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        )}
      </div>
    );
  }
}
