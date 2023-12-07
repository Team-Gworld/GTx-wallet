import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import {
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  doesAmountErrorRequireUpdate,
} from './send.utils';
import {
  getToWarningObject,
  getToErrorObject,
} from './send-content/add-recipient/add-recipient';
import SendHeader from './send-header';
import AddRecipient from './send-content/add-recipient';
import SendContent from './send-content';
import SendFooter from './send-footer';
import EnsInput from './send-content/add-recipient/ens-input';

export default class SendTransactionScreen extends Component {
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
    hasHexData: PropTypes.bool,
    history: PropTypes.object,
    network: PropTypes.string,
    primaryCurrency: PropTypes.string,
    resetSendState: PropTypes.func.isRequired,
    selectedAddress: PropTypes.string,
    sendAsset: PropTypes.object,
    showHexData: PropTypes.bool,
    to: PropTypes.string,
    toNickname: PropTypes.string,
    tokens: PropTypes.array,
    tokenBalance: PropTypes.string,
    tokenContract: PropTypes.object,
    updateAndSetGasLimit: PropTypes.func.isRequired,
    updateSendEnsResolution: PropTypes.func.isRequired,
    updateSendEnsResolutionError: PropTypes.func.isRequired,
    updateSendErrors: PropTypes.func.isRequired,
    updateSendTo: PropTypes.func.isRequired,
    updateSendTokenBalance: PropTypes.func.isRequired,
    updateToNicknameIfNecessary: PropTypes.func.isRequired,
    scanQrCode: PropTypes.func.isRequired,
    qrCodeDetected: PropTypes.func.isRequired,
    qrCodeData: PropTypes.object,
    nftSelected: PropTypes.object,
    selectedNative: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    query: '',
    toError: null,
    toWarning: null,
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 1000);
  }

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
      updateSendTo,
      updateSendTokenBalance,
      tokenContract,
      to,
      toNickname,
      addressBook,
      updateToNicknameIfNecessary,
      qrCodeData,
      qrCodeDetected,
    } = this.props;

    let updateGas = false;
    const {
      from: { balance: prevBalance },
      gasTotal: prevGasTotal,
      tokenBalance: prevTokenBalance,
      network: prevNetwork,
      sendAsset: prevSendAsset,
      to: prevTo,
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

    let scannedAddress;
    if (qrCodeData) {
      if (qrCodeData.type === 'address') {
        scannedAddress = qrCodeData.values.address.toLowerCase();
        const currentAddress = prevTo && prevTo.toLowerCase();
        if (currentAddress !== scannedAddress) {
          updateSendTo(scannedAddress);
          updateGas = true;
          // Clean up QR code data after handling
          qrCodeDetected(null);
        }
      }
    }

    if (updateGas) {
      if (scannedAddress) {
        this.updateGas({ to: scannedAddress });
      } else {
        this.updateGas();
      }
    }
  }

  componentDidMount() {
    this.props.fetchBasicGasEstimates().then(() => {
      this.updateGas();
    });
  }

  UNSAFE_componentWillMount() {
    this.updateSendAsset();

    // Show QR Scanner modal  if ?scan=true
    if (window.location.search === '?scan=true') {
      this.props.scanQrCode();

      // Clear the queryString param after showing the modal
      const cleanUrl = window.location.href.split('?')[0];
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }

  componentWillUnmount() {
    this.props.resetSendState();
  }

  onRecipientInputChange = (query) => {
    if (query) {
      this.dValidate(query);
    } else {
      this.validate(query);
    }

    this.setState({
      query,
    });
  };

  validate(query) {
    const { hasHexData, tokens, sendAsset, network } = this.props;

    if (!query) {
      this.setState({ toError: '', toWarning: '' });
      return;
    }

    const toErrorObject = getToErrorObject(query, hasHexData, network);
    const toWarningObject = getToWarningObject(query, tokens, sendAsset);

    this.setState({
      toError: toErrorObject.to,
      toWarning: toWarningObject.to,
    });
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
    const { history, to } = this.props;
    let content;

    if (to) {
      content = this.renderSendContent();
    } else {
      content = this.renderAddRecipient();
    }

    return (
      <div className="page-container">
        <SendHeader history={history} />
        {this.renderInput()}
        {content}
      </div>
    );
  }

  renderInput() {
    return (
      <EnsInput
        className="send__to-row"
        scanQrCode={(_) => {
          this.props.scanQrCode();
        }}
        onChange={this.onRecipientInputChange}
        onValidAddressTyped={(address) => this.props.updateSendTo(address, '')}
        onPaste={(text) => {
          this.props.updateSendTo(text) && this.updateGas();
        }}
        onReset={() => this.props.updateSendTo('', '')}
        updateEnsResolution={this.props.updateSendEnsResolution}
        updateEnsResolutionError={this.props.updateSendEnsResolutionError}
      />
    );
  }

  renderAddRecipient() {
    const { toError, toWarning } = this.state;

    return (
      <AddRecipient
        updateGas={({ to, amount, data } = {}) =>
          this.updateGas({ to, amount, data })
        }
        query={this.state.query}
        toError={toError}
        toWarning={toWarning}
      />
    );
  }

  renderSendContent() {
    const {
      history,
      showHexData,
      sendAsset,
      nftSelected,
      tokens,
      selectedNative,
    } = this.props;

    let isNFT = false;
    if (nftSelected) {
      const token = tokens.filter((t) => t.address === sendAsset?.address)?.[0];
      isNFT = nftSelected && token?.address === nftSelected.tokenAddress;
    }

    return [
      <SendContent
        key="send-content"
        updateGas={({ to, amount, data } = {}) =>
          this.updateGas({ to, amount, data })
        }
        showHexData={showHexData}
        sendingNFT={isNFT ? nftSelected : undefined}
        inNativeMode={selectedNative}
      />,
      <SendFooter key="send-footer" history={history} />,
    ];
  }
}
