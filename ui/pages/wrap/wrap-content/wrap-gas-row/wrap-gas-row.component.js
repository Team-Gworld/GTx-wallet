import React, { Component } from 'react';
import PropTypes from 'prop-types';
import WrapRowWrapper from '../wrap-row-wrapper';
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group';
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component';

export default class SendGasRow extends Component {
  static propTypes = {
    balance: PropTypes.string,
    balance2: PropTypes.string,
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    maxModeOn: PropTypes.bool,
    showCustomizeGasModal: PropTypes.func,
    sendAsset: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setGasPriceParams: PropTypes.func,
    setGasLimit: PropTypes.func,
    tokenBalance: PropTypes.string,
    gasPriceButtonGroupProps: PropTypes.object,
    gasButtonGroupShown: PropTypes.bool,
    advancedInlineGasShown: PropTypes.bool,
    resetGasButtons: PropTypes.func,
    gasPriceParams: PropTypes.object,
    gasLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    isMainnet: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  renderAdvancedOptionsButton() {
    const { showCustomizeGasModal, isMainnet } = this.props;
    // Tests should behave in same way as mainnet, but are using Localhost
    if (!isMainnet && !process.env.IN_TEST) {
      return null;
    }
    return (
      <div
        className="advanced-gas-options-btn"
        onClick={() => {
          showCustomizeGasModal();
        }}
      >
        {this.context.t('advancedOptions')}
      </div>
    );
  }

  setMaxAmount() {
    const {
      balance,
      balance2,
      gasTotal,
      sendAsset,
      setAmountToMax,
      tokenBalance,
    } = this.props;

    setAmountToMax({
      balance,
      balance2,
      gasTotal,
      sendAsset,
      tokenBalance,
    });
  }

  renderContent() {
    const {
      gasLoadingError,
      gasTotal,
      showCustomizeGasModal,
      gasPriceButtonGroupProps,
      gasButtonGroupShown,
      advancedInlineGasShown,
      maxModeOn,
      resetGasButtons,
      setGasPriceParams,
      setGasLimit,
      gasPriceParams,
      gasLimit,
      insufficientBalance,
      isMainnet,
    } = this.props;

    const gasPriceButtonGroup = (
      <div>
        <GasPriceButtonGroup
          className="gas-price-button-group--small"
          showCheck={false}
          {...gasPriceButtonGroupProps}
          handleGasPriceSelection={async (...args) => {
            await gasPriceButtonGroupProps.handleGasPriceSelection(...args);
            if (maxModeOn) {
              this.setMaxAmount();
            }
          }}
        />
        {this.renderAdvancedOptionsButton()}
      </div>
    );
    const gasFeeDisplay = (
      <GasFeeDisplay
        gasLoadingError={gasLoadingError}
        gasTotal={gasTotal}
        onReset={() => {
          resetGasButtons();
          if (maxModeOn) {
            this.setMaxAmount();
          }
        }}
        onClick={() => showCustomizeGasModal()}
      />
    );
    const advancedGasInputs = (
      <div>
        <AdvancedGasInputs
          updateCustomGasPriceParams={(newGasPriceParams) =>
            setGasPriceParams(newGasPriceParams, gasLimit)
          }
          updateCustomGasLimit={(newGasLimit) =>
            setGasLimit(
              newGasLimit,
              gasPriceParams.maxFeePerGas ?? gasPriceParams.gasPrice,
            )
          }
          customGasPriceParams={gasPriceParams}
          customGasLimit={gasLimit}
          insufficientBalance={insufficientBalance}
          customPriceIsSafe
          isSpeedUp={false}
        />
        {this.renderAdvancedOptionsButton()}
      </div>
    );
    // Tests should behave in same way as mainnet, but are using Localhost
    if (advancedInlineGasShown || (!isMainnet && !process.env.IN_TEST)) {
      return advancedGasInputs;
    } else if (gasButtonGroupShown) {
      return gasPriceButtonGroup;
    }
    return gasFeeDisplay;
  }

  render() {
    const { gasFeeError } = this.props;

    return (
      <WrapRowWrapper
        label={`${this.context.t('transactionFee')}:`}
        showError={gasFeeError}
        errorType="gasFee"
      >
        {this.renderContent()}
      </WrapRowWrapper>
    );
  }
}
