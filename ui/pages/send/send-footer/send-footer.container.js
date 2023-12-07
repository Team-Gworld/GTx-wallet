import { connect } from 'react-redux';
import ethUtil from 'ethereumjs-util';
import * as thetajs from '@thetalabs/theta-js';
import { ASSET_TYPE } from '../../../../shared/constants/transaction';
import {
  addToAddressBook,
  clearSend,
  signNftTx,
  signTokenTx,
  signTx,
  updateTransaction,
} from '../../../store/actions';
import {
  getGasLimit,
  getGasPriceParams,
  getGasTotal,
  getSendAsset,
  getSendAmount,
  getSendEditingTransactionId,
  getSendFromObject,
  getSendTo,
  getSendToAccounts,
  getSendHexData,
  getTokenBalance,
  getUnapprovedTxs,
  isSendFormInError,
  getGasIsLoading,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
  getSelectedNative,
} from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import SendFooter from './send-footer.component';
import {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
} from './send-footer.utils';

const ThetaTxType = thetajs.constants.TxType;

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter);

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPriceParams = getGasPriceParams(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    state,
    gasButtonInfo,
    gasPriceParams,
  );
  const gasEstimateType =
    activeButtonIndex >= 0
      ? gasButtonInfo[activeButtonIndex].gasEstimateType
      : 'custom';
  const editingTransactionId = getSendEditingTransactionId(state);

  return {
    amount: getSendAmount(state),
    data: getSendHexData(state),
    editingTransactionId,
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPriceParams: getGasPriceParams(state),
    gasTotal: getGasTotal(state),
    inError: isSendFormInError(state),
    sendAsset: getSendAsset(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    tokenBalance: getTokenBalance(state),
    unapprovedTxs: getUnapprovedTxs(state),
    gasEstimateType,
    gasIsLoading: getGasIsLoading(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    selectedNative: getSelectedNative(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    sign: ({
      sendAsset,
      to,
      amount,
      from,
      gas,
      gasPriceParams,
      data,
      isThetaNative,
    }) => {
      const txParams = constructTxParams({
        amount,
        data,
        from,
        gas,
        ...gasPriceParams,
        sendAsset,
        to,
        isThetaNative,
        thetaTxType: isThetaNative ? ThetaTxType.Send : undefined,
      });

      switch (sendAsset?.type) {
        case ASSET_TYPE.TOKEN:
          dispatch(signTokenTx(sendAsset.address, to, amount, txParams));
          break;
        case ASSET_TYPE.NFT:
          dispatch(
            signNftTx(sendAsset.address, from, to, sendAsset.tokenID, txParams),
          );
          break;
        default:
          dispatch(signTx(txParams));
      }
    },
    update: (opts) => {
      const editingTx = constructUpdatedTx(opts);
      return dispatch(updateTransaction(editingTx));
    },

    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = ethUtil.addHexPrefix(newAddress);
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
        dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      }
    },
  };
}
