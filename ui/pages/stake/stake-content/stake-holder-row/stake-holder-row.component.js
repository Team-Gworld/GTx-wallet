import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as thetajs from '@thetalabs/theta-js';
import { TextareaAutosize } from '@material-ui/core';
import StakeRowWrapper from '../stake-row-wrapper';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../../shared/constants/transaction';
import {
  HolderLengths,
  getDefaultPurpose,
  validateHolderOrSummary,
} from '../../stake.utils';

export default class StakeHolderRow extends Component {
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
    updateSendTo: PropTypes.func.isRequired,
    updateSendErrors: PropTypes.func.isRequired,
    inError: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    holderOrSummary: PropTypes.string,
  };

  componentDidMount() {
    const { sendAssetStake: { holder, holderSummary } = {} } = this.props;
    const holderOrSummary = holderSummary ?? holder ?? '';
    this.selectHolderOrSummary(holderOrSummary);
  }

  componentDidUpdate(prevProps) {
    const {
      sendAssetType,
      sendAssetMode,
      sendAssetStake: { purpose } = {},
    } = this.props;
    if (
      sendAssetType !== prevProps.sendAssetType ||
      sendAssetMode !== prevProps.sendAssetMode ||
      purpose !== prevProps.sendAssetStake?.purpose
    ) {
      const { holderOrSummary } = this.state;
      this.selectHolderOrSummary(holderOrSummary);
    }
  }

  selectHolderOrSummary = (holderOrSummary) => {
    const {
      sendAssetType,
      token,
      sendAssetMode,
      sendAssetStake,
      sendAssetStake: { purpose } = {},
      updateSendErrors,
      inError: wasInError,
    } = this.props;
    const useSendAssetStake = { ...sendAssetStake };
    const usePurpose = purpose ?? getDefaultPurpose(sendAssetType);
    const { holderOrSummary: prevHolderOrSummary } = this.state;

    if (sendAssetType === ASSET_TYPE.TOKEN) {
      if (prevHolderOrSummary) {
        this.setState({ holderOrSummary: null });
      }
      if (wasInError) {
        updateSendErrors({ holder: null });
      }
      return;
    }

    const { valid, holder, holderSummary } = validateHolderOrSummary({
      holderOrSummary,
      mode: sendAssetMode,
      purpose,
      type: sendAssetType,
    });
    const inError = !valid;
    const useHolderOrSummary = valid
      ? holderSummary ?? holder
      : holderOrSummary;
    if (inError !== wasInError || holderOrSummary !== prevHolderOrSummary) {
      this.setState({
        holderOrSummary: useHolderOrSummary,
      });

      const expectSummary =
        sendAssetMode === ASSET_MODE.STAKE &&
        usePurpose !== thetajs.constants.StakePurpose.StakeForValidator;
      updateSendErrors({
        holder:
          (inError &&
            (expectSummary ? 'invalidHolderSummary' : 'invalidHolder')) ||
          null,
      });
    }
    if (!valid) {
      return;
    }

    useSendAssetStake.holder = holder;
    useSendAssetStake.holderSummary = holderSummary;
    useSendAssetStake.purpose = usePurpose;

    this.props.updateSendAsset({
      ...((![ASSET_TYPE.NATIVE, ASSET_TYPE.NATIVE2].includes(sendAssetType) &&
        token) || { address: null }),
      type: sendAssetType,
      mode: sendAssetMode,
      stake: useSendAssetStake,
    });
    this.props.updateSendTo(holder);
  };

  render() {
    const {
      sendAssetType,
      sendAssetMode,
      sendAssetStake: { purpose } = {},
      inError,
    } = this.props;
    const { holderOrSummary } = this.state;
    const { t } = this.context;

    if (sendAssetType === ASSET_TYPE.TOKEN) {
      return <></>;
    }

    const usePurpose = purpose ?? getDefaultPurpose(sendAssetType);
    const expectSummary =
      sendAssetMode === ASSET_MODE.STAKE &&
      usePurpose !== thetajs.constants.StakePurpose.StakeForValidator;
    const label = expectSummary ? 'holderSummary' : 'holder';
    return (
      <StakeRowWrapper
        label={`${t(label)}:`}
        showError={inError && holderOrSummary?.length > 0}
        errorType="holder"
      >
        <TextareaAutosize
          className="unit-input "
          type="textarea"
          maxLength={HolderLengths.eenSummary}
          dir="auto"
          placeholder={t('holderOrSummaryPlaceholder')}
          onChange={(event) => this.selectHolderOrSummary(event.target.value)}
          onPaste={(event) => this.selectHolderOrSummary(event.target.value)}
          value={typeof holderOrSummary === 'string' ? holderOrSummary : ''}
          autoFocus
          data-testid="holder-input"
        />
      </StakeRowWrapper>
    );
  }
}
