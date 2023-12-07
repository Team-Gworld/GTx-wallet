import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { debounce } from 'lodash';
import CheckBox from '../../../ui/check-box';
import {
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { baseFeeMultiplier } from '../../../../../app/scripts/controllers/gas/gasPricingTracker';

function convertGasPriceParamsToGWEI(gasPriceParamsInHexWEI) {
  const out = { ...gasPriceParamsInHexWEI };
  Object.keys(out).forEach((k) => {
    out[k] = Number(hexWEIToDecGWEI(out[k]));
  });
  return out;
}

function convertGasPriceParamsFromGWEI(gasPriceParamsInGWEI) {
  const out = { ...gasPriceParamsInGWEI };
  Object.keys(out).forEach((k) => {
    out[k] = decGWEIToHexWEI(out[k]);
  });
  return out;
}

export default class AdvancedGasInputs extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateCustomGasPriceParamsFromGWEI: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    basicGasEstimatesInGWEI: PropTypes.object,
    customGasPriceParams: PropTypes.object.isRequired,
    customGasLimit: PropTypes.number.isRequired,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    showGasPriceInfoModal: PropTypes.func,
    showGasMaxFeeInfoModal: PropTypes.func,
    showGasPriorityFeeInfoModal: PropTypes.func,
    showGasLimitInfoModal: PropTypes.func,
    supportsEip1559: PropTypes.bool,
    fixedPrice: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    const gasPriceParamsInGWEI = convertGasPriceParamsToGWEI(
      this.props.customGasPriceParams,
    );
    this.state = {
      gasPriceParamsInGWEI,
      gasLimit: this.props.customGasLimit,
      showEip1559: this.props.supportsEip1559 && !gasPriceParamsInGWEI.gasPrice,
    };
    this.changeGasPriceParams = debounce(this.changeGasPriceParams, 500);
    this.changeGasLimit = debounce(this.changeGasLimit, 500);
  }

  objectsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  componentDidUpdate(prevProps) {
    const {
      customGasPriceParams: prevCustomGasPriceParams,
      customGasLimit: prevCustomGasLimit,
    } = prevProps;
    const { customGasPriceParams, customGasLimit } = this.props;
    const { gasPriceParamsInGWEI, gasLimit } = this.state;
    const gasPriceParams = convertGasPriceParamsFromGWEI(gasPriceParamsInGWEI);

    if (
      !this.objectsEqual(customGasPriceParams, prevCustomGasPriceParams) &&
      !this.objectsEqual(customGasPriceParams, gasPriceParams)
    ) {
      // gasPriceParams is not hex like the rest!
      this.setState({
        gasPriceParamsInGWEI: convertGasPriceParamsToGWEI(customGasPriceParams),
      });
    }
    if (customGasLimit !== prevCustomGasLimit && customGasLimit !== gasLimit) {
      this.setState({ gasLimit: customGasLimit });
    }
  }

  onChangeLegacyGas = () => {
    const { basicGasEstimatesInGWEI } = this.props;
    const { showEip1559, gasPriceParamsInGWEI } = this.state;
    const useShowEip1559 = !showEip1559;
    const newGasPriceParams = {
      ...(useShowEip1559 && {
        maxFeePerGas:
          (basicGasEstimatesInGWEI?.baseFee || 0) * baseFeeMultiplier +
            (basicGasEstimatesInGWEI?.average || 0) ||
          gasPriceParamsInGWEI.gasPrice,
        maxPriorityFeePerGas: basicGasEstimatesInGWEI?.average || 0 || 1,
      }),
      ...(!useShowEip1559 && {
        gasPrice:
          (basicGasEstimatesInGWEI?.baseFee || 0) +
            (basicGasEstimatesInGWEI?.average || 0) ||
          gasPriceParamsInGWEI.maxFeePerGas,
      }),
    };
    this.setState({
      showEip1559: useShowEip1559,
      gasPriceParamsInGWEI: newGasPriceParams,
    });
    this.changeGasPriceParams(newGasPriceParams);
  };

  onChangeGasLimit = (e) => {
    this.setState({ gasLimit: e.target.value });
    this.changeGasLimit({ target: { value: e.target.value } });
  };

  changeGasLimit = (e) => {
    this.props.updateCustomGasLimit(Number(e.target.value));
  };

  onChangeGasPrice = (e) => {
    const newGasPriceParams = { gasPrice: Number(e.target.value) };
    this.setState({ gasPriceParamsInGWEI: newGasPriceParams });
    this.changeGasPriceParams(newGasPriceParams);
  };

  onChangeMaxFeePerGas = (e) => {
    const newGasPriceParams = {
      maxFeePerGas: Number(e.target.value),
      maxPriorityFeePerGas:
        this.state.gasPriceParamsInGWEI.maxPriorityFeePerGas,
    };
    this.setState({ gasPriceParamsInGWEI: newGasPriceParams });
    this.changeGasPriceParams(newGasPriceParams);
  };

  onChangeMaxPriorityFeePerGas = (e) => {
    const newGasPriceParams = {
      maxFeePerGas: this.state.gasPriceParamsInGWEI.maxFeePerGas,
      maxPriorityFeePerGas: Number(e.target.value),
    };
    this.setState({ gasPriceParamsInGWEI: newGasPriceParams });
    this.changeGasPriceParams(newGasPriceParams);
  };

  changeGasPriceParams = (newGasPriceParams) => {
    this.props.updateCustomGasPriceParamsFromGWEI(newGasPriceParams);
  };

  gasPriceError({
    insufficientBalance,
    customPriceIsSafe,
    isSpeedUp,
    gasPriceParamsInGWEI,
  }) {
    const { t } = this.context;

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      };
    } else if (
      isSpeedUp &&
      (gasPriceParamsInGWEI.maxFeePerGas === 0 ||
        gasPriceParamsInGWEI.gasPrice === 0)
    ) {
      return {
        errorText: t('zeroGasPriceOnSpeedUpError'),
        errorType: 'error',
      };
    } else if (!customPriceIsSafe) {
      return {
        errorText: t('gasPriceExtremelyLow'),
        errorType: 'warning',
      };
    }

    return {};
  }

  gasLimitError({ insufficientBalance, gasLimit }) {
    const { t } = this.context;

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      };
    } else if (gasLimit < 21000) {
      return {
        errorText: t('gasLimitTooLow'),
        errorType: 'error',
      };
    }

    return {};
  }

  renderGasInput({
    value,
    onChange,
    errorComponent,
    errorType,
    infoOnClick,
    label,
    fixedPrice,
  }) {
    return (
      <div className="advanced-gas-inputs__gas-edit-row">
        <div className="advanced-gas-inputs__gas-edit-row__label">
          {label}
          <i className="fa fa-info-circle" onClick={infoOnClick} />
        </div>
        <div className="advanced-gas-inputs__gas-edit-row__input-wrapper">
          <input
            className={classnames('advanced-gas-inputs__gas-edit-row__input', {
              'advanced-gas-inputs__gas-edit-row__input--error':
                errorType === 'error',
              'advanced-gas-inputs__gas-edit-row__input--warning':
                errorType === 'warning',
            })}
            type="number"
            min="0"
            value={value}
            onChange={onChange}
            readOnly={fixedPrice}
          />
          {!fixedPrice && (
            <div
              className={classnames(
                'advanced-gas-inputs__gas-edit-row__input-arrows',
                {
                  'advanced-gas-inputs__gas-edit-row__input--error':
                    errorType === 'error',
                  'advanced-gas-inputs__gas-edit-row__input--warning':
                    errorType === 'warning',
                },
              )}
            >
              <div
                className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
                onClick={() => onChange({ target: { value: value + 1 } })}
              >
                <i className="fa fa-sm fa-angle-up" />
              </div>
              <div
                className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
                onClick={() =>
                  onChange({ target: { value: Math.max(value - 1, 0) } })
                }
              >
                <i className="fa fa-sm fa-angle-down" />
              </div>
            </div>
          )}
          {errorComponent}
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const {
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      showGasPriceInfoModal,
      showGasMaxFeeInfoModal,
      showGasPriorityFeeInfoModal,
      showGasLimitInfoModal,
      supportsEip1559,
      fixedPrice,
    } = this.props;
    const { gasPriceParamsInGWEI, gasLimit, showEip1559 } = this.state;

    const { errorText: gasPriceErrorText, errorType: gasPriceErrorType } =
      this.gasPriceError({
        insufficientBalance,
        customPriceIsSafe,
        isSpeedUp,
        gasPriceParamsInGWEI,
      });
    const gasPriceErrorComponent = gasPriceErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasPriceErrorType}-text`}
      >
        {gasPriceErrorText}
      </div>
    ) : null;

    const { errorText: gasLimitErrorText, errorType: gasLimitErrorType } =
      this.gasLimitError({ insufficientBalance, gasLimit });
    const gasLimitErrorComponent = gasLimitErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasLimitErrorType}-text`}
      >
        {gasLimitErrorText}
      </div>
    ) : null;

    return (
      <>
        {supportsEip1559 && (
          <div className="advanced-gas-inputs__gas-edit-rows">
            <div className="advanced-gas-inputs__gas-edit-row legacy-gas">
              <CheckBox
                id="check_show_eip_1559"
                checked={!showEip1559}
                className={classnames('check-box', {
                  'far fa-square': showEip1559,
                  'fa fa-check-square check-box__checked': !showEip1559,
                })}
                onClick={this.onChangeLegacyGas}
                title={t('legacyGasPricing')}
              />
              <div className="advanced-gas-inputs__gas-edit-row__label">
                {t('legacyGasPricing')}
              </div>
            </div>
          </div>
        )}
        <div
          className={classnames('advanced-gas-inputs__gas-edit-rows', {
            'legacy-gas': !showEip1559,
          })}
        >
          {showEip1559 ? (
            <>
              {this.renderGasInput({
                label: this.context.t('gasMaxFee'),
                value: this.state.gasPriceParamsInGWEI.maxFeePerGas,
                onChange: this.onChangeMaxFeePerGas,
                errorComponent: gasPriceErrorComponent,
                errorType: gasPriceErrorType,
                infoOnClick: showGasMaxFeeInfoModal,
              })}
              {this.renderGasInput({
                label: this.context.t('gasPriorityFee'),
                value: this.state.gasPriceParamsInGWEI.maxPriorityFeePerGas,
                onChange: this.onChangeMaxPriorityFeePerGas,
                errorComponent: gasPriceErrorComponent,
                errorType: gasPriceErrorType,
                infoOnClick: showGasPriorityFeeInfoModal,
              })}
            </>
          ) : (
            <>
              {this.renderGasInput({
                label: this.context.t('gasPrice'),
                value: this.state.gasPriceParamsInGWEI.gasPrice,
                onChange: this.onChangeGasPrice,
                errorComponent: gasPriceErrorComponent,
                errorType: gasPriceErrorType,
                infoOnClick: showGasPriceInfoModal,
                fixedPrice,
              })}
            </>
          )}
          {this.renderGasInput({
            label: this.context.t('gasLimit'),
            value: this.state.gasLimit,
            onChange: this.onChangeGasLimit,
            errorComponent: gasLimitErrorComponent,
            errorType: gasLimitErrorType,
            infoOnClick: showGasLimitInfoModal,
          })}
        </div>
      </>
    );
  }
}
