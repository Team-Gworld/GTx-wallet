import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as thetajs from '@thetalabs/theta-js';
import StakeRowWrapper from '../stake-row-wrapper';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../../shared/constants/transaction';
import { getDefaultPurpose } from '../../stake.utils';

const { StakePurpose } = thetajs.constants;

export default class StakeTypeRow extends Component {
  static propTypes = {
    token: PropTypes.shape({
      address: PropTypes.string,
      decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      symbol: PropTypes.string,
      staking: PropTypes.object,
    }),
    sendAssetType: PropTypes.string,
    sendAssetMode: PropTypes.string,
    sendAssetStake: PropTypes.object,
    updateSendAsset: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isShowingDropdown: false,
  };

  openDropdown = () => this.setState({ isShowingDropdown: true });

  closeDropdown = () => this.setState({ isShowingDropdown: false });

  selectType = (purpose) => {
    this.setState(
      {
        isShowingDropdown: false,
      },
      () => {
        const { sendAssetType, token, sendAssetMode, sendAssetStake } =
          this.props;
        const useSendAssetStake = { ...sendAssetStake };
        useSendAssetStake.purpose = purpose;
        this.props.updateSendAsset({
          ...((![ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(
            sendAssetType,
          ) &&
            token) || { address: null }),
          type: sendAssetType,
          mode: sendAssetMode,
          stake: useSendAssetStake,
        });
      },
    );
  };

  render() {
    const {
      sendAssetType,
      sendAssetMode,
      sendAssetStake: { purpose } = {},
    } = this.props;
    const { t } = this.context;
    const usePurpose = purpose ?? getDefaultPurpose(sendAssetType, true);

    return sendAssetMode === ASSET_MODE.UNSTAKE ||
      usePurpose === undefined ||
      usePurpose === null ? (
      <></>
    ) : (
      <StakeRowWrapper label={`${t('type')}:`}>
        <div className="wrap-v2__asset-dropdown">
          {this.renderSelectedType(usePurpose)}
          {this.renderTypeDropdown()}
        </div>
      </StakeRowWrapper>
    );
  }

  getAssetStakePurposes(sendAssetType) {
    switch (sendAssetType) {
      case ASSET_TYPE.NATIVE:
        return [StakePurpose.StakeForEliteEdge];
      case ASSET_TYPE.NATIVE2:
        return [StakePurpose.StakeForGuardian, StakePurpose.StakeForValidator];
      default:
        return [];
    }
  }

  renderSelectedType(purpose) {
    return (
      <div
        className="wrap-v2__asset-dropdown__input-wrapper"
        onClick={this.openDropdown}
      >
        {this.renderType(purpose, 0, false)}
      </div>
    );
  }

  renderTypeDropdown() {
    const { sendAssetType } = this.props;
    const purposes = this.getAssetStakePurposes(sendAssetType);
    return (
      this.state.isShowingDropdown && (
        <div>
          <div
            className="wrap-v2__asset-dropdown__close-area"
            onClick={this.closeDropdown}
          />
          <div className="wrap-v2__asset-dropdown__list">
            {purposes.map((purpose, index) =>
              this.renderType(purpose, index, true),
            )}
          </div>
        </div>
      )
    );
  }

  renderType(purpose, index, insideDropdown = false) {
    const { t } = this.context;
    let text;
    switch (purpose) {
      case StakePurpose.StakeForGuardian:
        text = t('guardianNode');
        break;
      case StakePurpose.StakeForValidator:
        text = t('validatorNode');
        break;
      case StakePurpose.StakeForEliteEdge:
        text = t('eliteEdgeNode');
        break;
      default:
        text = '';
    }

    return (
      <div
        key={index}
        className="wrap-v2__asset-dropdown__asset"
        onClick={() => this.selectType(purpose)}
      >
        <div className="wrap-v2__asset-dropdown__asset-data">
          <div className="wrap-v2__asset-dropdown__name">
            <span className="wrap-v2__asset-dropdown__symbol">{`${text}`}</span>
          </div>
        </div>
        {!insideDropdown && (
          <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        )}
      </div>
    );
  }
}
