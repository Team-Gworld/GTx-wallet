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
  getSendFromObject,
  getSendTo,
  getSendToNickname,
  getTokenBalance,
  getSelectedAddress,
  getAddressBook,
  getSelectedNative,
} from '../../selectors';
import {
  updateSendTo,
  updateSendTokenBalance,
  updateGasData,
  setGasTotal,
} from '../../store/actions';
import { resetSendState, updateSendErrors } from '../../ducks/send/send.duck';
import { fetchBasicGasEstimates } from '../../ducks/gas/gas.duck';
import { isValidDomainName } from '../../helpers/utils/util';
import { calcGasTotal } from '../send/send.utils';
import Stake from './stake.component';

function mapStateToProps(state) {
  const editingTransactionId = getSendEditingTransactionId(state);
  const network = getCurrentNetwork(state);
  const selectedNative = getSelectedNative(state);
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
    primaryCurrency: getPrimaryCurrency(state),
    selectedAddress: getSelectedAddress(state),
    sendAsset: getSendAsset(state),
    to: getSendTo(state),
    toNickname: getSendToNickname(state),
    tokenBalance: getTokenBalance(state),
    tokenContract: getSendAssetContract(state),
    network,
    selectedNative,
    onRightNetwork: network === THETAMAINNET_NETWORK_ID && selectedNative,
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
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
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
)(Stake);
