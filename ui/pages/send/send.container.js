import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { THETAMAINNET_NETWORK_ID } from '../../../app/scripts/controllers/network/enums';
import {
  getBlockGasLimit,
  getConversionRate,
  getCurrentNetwork,
  getGasLimit,
  getGasPriceParams,
  getGasTotal,
  getPrimaryCurrency,
  getSendAsset,
  getSendAssetContract,
  getSendAmount,
  getSendEditingTransactionId,
  getSendHexDataFeatureFlagState,
  getSendFromObject,
  getSendTo,
  getSendToNickname,
  getTokenBalance,
  getQrCodeData,
  getSelectedAddress,
  getAddressBook,
  getSelectedNFT,
  getSelectedNative,
} from '../../selectors';
import {
  updateSendTo,
  updateSendTokenBalance,
  updateGasData,
  setGasTotal,
  showQrScanner,
  qrCodeDetected,
  updateSendEnsResolution,
  updateSendEnsResolutionError,
} from '../../store/actions';
import { resetSendState, updateSendErrors } from '../../ducks/send/send.duck';
import { fetchBasicGasEstimates } from '../../ducks/gas/gas.duck';
import { getTokens } from '../../ducks/metamask/metamask';
import { isValidDomainName } from '../../helpers/utils/util';
import { calcGasTotal } from './send.utils';
import SendEther from './send.component';

function mapStateToProps(state) {
  const editingTransactionId = getSendEditingTransactionId(state);
  const selectedNative = getSelectedNative(state);
  const network = getCurrentNetwork(state);
  const out = {
    addressBook: getAddressBook(state),
    amount: getSendAmount(state),
    blockGasLimit: getBlockGasLimit(state),
    conversionRate: getConversionRate(state),
    editingTransactionId,
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPriceParams: getGasPriceParams(state),
    gasTotal: getGasTotal(state),
    network,
    primaryCurrency: getPrimaryCurrency(state),
    qrCodeData: getQrCodeData(state),
    selectedAddress: getSelectedAddress(state),
    sendAsset: getSendAsset(state),
    showHexData:
      (!selectedNative || network !== THETAMAINNET_NETWORK_ID) &&
      getSendHexDataFeatureFlagState(state),
    to: getSendTo(state),
    toNickname: getSendToNickname(state),
    tokens: getTokens(state),
    tokenBalance: getTokenBalance(state),
    tokenContract: getSendAssetContract(state),
    nftSelected: getSelectedNFT(state),
    selectedNative,
  };
  return out;
}

function mapDispatchToProps(dispatch) {
  return {
    updateAndSetGasLimit: ({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPriceParams,
      selectedAddress,
      sendAsset,
      to,
      value,
      data,
      network,
      selectedNative,
    }) => {
      editingTransactionId
        ? dispatch(
            setGasTotal(
              calcGasTotal(
                gasLimit,
                (gasPriceParams?.maxFeePerGas ?? gasPriceParams?.gasPrice) ||
                  '0x0',
              ),
            ),
          )
        : dispatch(
            updateGasData({
              gasPriceParams,
              selectedAddress,
              sendAsset,
              blockGasLimit,
              to,
              value,
              data,
              network,
              selectedNative,
            }),
          );
    },
    updateSendTokenBalance: ({ sendAsset, tokenContract, address }) => {
      dispatch(
        updateSendTokenBalance({
          sendAsset,
          tokenContract,
          address,
        }),
      );
    },
    updateSendErrors: (newError) => dispatch(updateSendErrors(newError)),
    resetSendState: () => dispatch(resetSendState()),
    scanQrCode: () => dispatch(showQrScanner()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    updateSendEnsResolution: (ensResolution) =>
      dispatch(updateSendEnsResolution(ensResolution)),
    updateSendEnsResolutionError: (message) =>
      dispatch(updateSendEnsResolutionError(message)),
    updateToNicknameIfNecessary: (to, toNickname, addressBook) => {
      if (isValidDomainName(toNickname)) {
        const addressBookEntry =
          addressBook.find(({ address }) => to === address) || {};
        if (!addressBookEntry.name !== toNickname) {
          dispatch(updateSendTo(to, addressBookEntry.name || ''));
        }
      }
    },
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SendEther);
