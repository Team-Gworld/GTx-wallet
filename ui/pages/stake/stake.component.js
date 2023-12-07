import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  doesAmountErrorRequireUpdate,
} from '../send/send.utils';
import { ASSET_MODE } from '../../../shared/constants/transaction';
import StakeHeader from './stake-header';
import StakeContent from './stake-content';
import StakeFooter from './stake-footer';

export default class StakeTransactionScreen extends Component {
  static propTypes = {
    addressBook: PropTypes.arrayOf(PropTypes.object),
    amount: PropTypes.string,
    blockGasLimit: PropTypes.string,
    conversionRate: PropTypes.number,
    editingTransactionId: PropTypes.string,
    fetchBasicGasEstimates: PropTypes.func.isRequired,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPriceParams: PropTypes.object,
    gasTotal: PropTypes.string,
    primaryCurrency: PropTypes.string,
    resetSendState: PropTypes.func.isRequired,
    selectedAddress: PropTypes.string,
    sendAsset: PropTypes.object,
    to: PropTypes.string,
    toNickname: PropTypes.string,
    tokenBalance: PropTypes.string,
    tokenContract: PropTypes.object,
    updateAndSetGasLimit: PropTypes.func.isRequired,
    updateSendErrors: PropTypes.func.isRequired,
    updateSendTokenBalance: PropTypes.func.isRequired,
    updateToNicknameIfNecessary: PropTypes.func.isRequired,
    history: PropTypes.object,
    network: PropTypes.string,
    selectedNative: PropTypes.bool,
    onRightNetwork: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  componentDidUpdate(prevProps) {
    const {
      amount,
      conversionRate,
      from: { address, balance },
      gasTotal,
      network,
      primaryCurrency,
      sendAsset,
      tokenBalance,
      updateSendErrors,
      updateSendTokenBalance,
      tokenContract,
      to,
      toNickname,
      addressBook,
      updateToNicknameIfNecessary,
    } = this.props;

    let updateGas = false;
    const {
      from: { balance: prevBalance },
      gasTotal: prevGasTotal,
      tokenBalance: prevTokenBalance,
      network: prevNetwork,
      sendAsset: prevSendAsset,
    } = prevProps;

    const uninitialized = [prevBalance, prevGasTotal].every((n) => n === null);

    const amountErrorRequiresUpdate = doesAmountErrorRequireUpdate({
      balance,
      gasTotal,
      prevBalance,
      prevGasTotal,
      prevTokenBalance,
      sendAsset,
      tokenBalance,
    });

    if (amountErrorRequiresUpdate) {
      const amountErrorObject = getAmountErrorObject({
        amount,
        balance,
        conversionRate,
        gasTotal,
        primaryCurrency,
        sendAsset,
        tokenBalance,
      });
      const gasFeeErrorObject = sendAsset
        ? getGasFeeErrorObject({
            balance,
            conversionRate,
            gasTotal,
            primaryCurrency,
            sendAsset,
          })
        : { gasFee: null };
      updateSendErrors(Object.assign(amountErrorObject, gasFeeErrorObject));
    }

    if (!uninitialized) {
      if (network !== prevNetwork && network !== 'loading') {
        updateSendTokenBalance({
          sendAsset,
          tokenContract,
          address,
        });
        updateToNicknameIfNecessary(to, toNickname, addressBook);
        updateGas = true;
      }
    }

    const prevTokenAddress = prevSendAsset?.address;
    const sendAssetAddress = sendAsset?.address;

    if (sendAssetAddress && prevTokenAddress !== sendAssetAddress) {
      this.updateSendAsset();
      updateGas = true;
    }

    if (updateGas) {
      this.updateGas();
    }
  }

  componentDidMount() {
    this.props.fetchBasicGasEstimates().then(() => {
      this.updateGas();
    });
  }

  UNSAFE_componentWillMount() {
    this.updateSendAsset();
  }

  componentWillUnmount() {
    this.props.resetSendState();
  }

  updateSendAsset() {
    const {
      from: { address },
      sendAsset,
      tokenContract,
      updateSendTokenBalance,
    } = this.props;

    updateSendTokenBalance({
      sendAsset,
      tokenContract,
      address,
    });
  }

  updateGas({ to: updatedToAddress, amount: value, data } = {}) {
    const {
      amount,
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPriceParams,
      selectedAddress,
      sendAsset,
      to: currentToAddress,
      updateAndSetGasLimit,
      network,
      selectedNative,
    } = this.props;

    updateAndSetGasLimit({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPriceParams,
      selectedAddress,
      sendAsset,
      to: getToAddressForGasUpdate(updatedToAddress, currentToAddress),
      value: value || amount,
      data,
      network,
      selectedNative,
    });
  }

  render() {
    const { history, sendAsset, onRightNetwork } = this.props;
    return (
      <div className="page-container">
        {onRightNetwork ? (
          <>
            <StakeHeader
              history={history}
              isUnstaking={sendAsset?.mode === ASSET_MODE.UNSTAKE}
            />
            <StakeContent
              history={history}
              updateGas={(opts) => this.updateGas(opts)}
            />
            <StakeFooter history={history} />
          </>
        ) : (
          <Redirect to={{ pathname: DEFAULT_ROUTE }} />
        )}
      </div>
    );
  }
}
