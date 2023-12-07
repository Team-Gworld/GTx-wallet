import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdvancedGasInputs from '../../advanced-gas-inputs';

export default class AdvancedTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateCustomGasPriceParams: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customModalGasPriceParamsInHex: PropTypes.object,
    customModalGasLimitInHex: PropTypes.string,
    transactionFee: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
  };

  renderDataSummary(transactionFee) {
    return (
      <div className="advanced-tab__transaction-data-summary">
        <div className="advanced-tab__transaction-data-summary__titles">
          <span>{this.context.t('newTransactionFee')}</span>
        </div>
        <div className="advanced-tab__transaction-data-summary__container">
          <div className="advanced-tab__transaction-data-summary__fee">
            {transactionFee}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      updateCustomGasPriceParams,
      updateCustomGasLimit,
      customModalGasPriceParamsInHex,
      customModalGasLimitInHex,
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      transactionFee,
    } = this.props;

    return (
      <div className="advanced-tab">
        {this.renderDataSummary(transactionFee)}
        <div className="advanced-tab__fee-chart">
          <div className="advanced-tab__gas-inputs">
            <AdvancedGasInputs
              updateCustomGasPriceParams={updateCustomGasPriceParams}
              updateCustomGasLimit={updateCustomGasLimit}
              customGasPriceParams={customModalGasPriceParamsInHex}
              customGasLimit={customModalGasLimitInHex}
              insufficientBalance={insufficientBalance}
              customPriceIsSafe={customPriceIsSafe}
              isSpeedUp={isSpeedUp}
            />
          </div>
        </div>
      </div>
    );
  }
}
