import abi from 'human-standard-token-abi';
import { calcGasTotal } from '../pages/send/send.utils';
import { ASSET_TYPE } from '../../shared/constants/transaction';
import {
  ETH_SYMBOL,
  ETH_TOKEN_IMAGE_URL,
  TFUEL_SYMBOL,
  TFUEL_TOKEN_IMAGE_URL,
  THETA_SYMBOL,
  THETA_TOKEN_IMAGE_URL,
} from '../../app/scripts/controllers/network/enums';
import {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getAverageGasPriceParams,
  getSelectedAccount,
  getTargetAccount,
} from '.';

export function getBlockGasLimit(state) {
  return state.metamask.currentBlockGasLimit;
}

export function getConversionRate(state) {
  return state.metamask.conversionRate;
}

export function getNativeCurrency(state) {
  return state.metamask.nativeCurrency;
}

export function getNativeCurrency2() {
  return THETA_SYMBOL;
}

export function getNativeCurrencyImage(state) {
  switch (getNativeCurrency(state)) {
    case ETH_SYMBOL:
      return ETH_TOKEN_IMAGE_URL;
    case TFUEL_SYMBOL:
      return TFUEL_TOKEN_IMAGE_URL;
    default:
      return undefined;
  }
}
export function getNativeCurrency2Image() {
  return THETA_TOKEN_IMAGE_URL;
}

export function getCurrentNetwork(state) {
  return state.metamask.network;
}

export function getGasLimit(state) {
  return state.metamask.send.gasLimit || '0';
}

export function getGasPriceParams(state, eip1559) {
  return (
    (Object.keys(state.metamask.send.gasPriceParams || {}).length &&
      state.metamask.send.gasPriceParams) ||
    getAverageGasPriceParams(state, eip1559)
  );
}

export function getGasTotal(state) {
  const gasPriceParams = getGasPriceParams(state);
  return calcGasTotal(
    getGasLimit(state),
    gasPriceParams.maxFeePerGas ?? gasPriceParams.gasPrice,
  );
}

export function getPrimaryCurrency(state) {
  const sendAsset = getSendAsset(state);
  return sendAsset?.symbol;
}

export function getSendAsset(state) {
  return state.metamask.send.asset;
}

export function getSendAssetAddress(state) {
  return getSendAsset(state)?.address;
}

export function getSendAssetType(state) {
  return getSendAsset(state)?.type;
}

export function getSendAssetStake(state) {
  return getSendAsset(state)?.stake;
}

export function getSendAssetMode(state) {
  return getSendAsset(state)?.mode;
}

export function getSendAssetContract(state) {
  const sendAssetAddress = getSendAssetAddress(state);
  return sendAssetAddress
    ? global.eth.contract(abi).at(sendAssetAddress)
    : null;
}

export function getSendAmount(state) {
  return state.metamask.send.amount;
}

export function getSendHexData(state) {
  return state.metamask.send.data;
}

export function getSendHexDataFeatureFlagState(state) {
  return state.metamask.featureFlags.sendHexData;
}

export function getSendEditingTransactionId(state) {
  return state.metamask.send.editingTransactionId;
}

export function getSendErrors(state) {
  return state.send.errors;
}

export function sendAmountIsInError(state) {
  return Boolean(state.send.errors.amount);
}

export function sendHolderIsInError(state) {
  return Boolean(state.send.errors.holder);
}

export function getSendFrom(state) {
  return state.metamask.send.from;
}

export function getSendFromBalance(state) {
  const fromAccount = getSendFromObject(state);
  return fromAccount.balance;
}

export function getSendFromBalance2(state) {
  const fromAccount = getSendFromObject(state);
  return fromAccount.balance2;
}

export function getSendFromObject(state) {
  const fromAddress = getSendFrom(state);
  return fromAddress
    ? getTargetAccount(state, fromAddress)
    : getSelectedAccount(state);
}

export function getSendMaxModeState(state) {
  return state.metamask.send.maxModeOn;
}

export function getSendTo(state) {
  return state.metamask.send.to;
}

export function getSendToNickname(state) {
  return state.metamask.send.toNickname;
}

export function getSendToAccounts(state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}
export function getTokenBalance(state) {
  return state.metamask.send.tokenBalance;
}

export function getSendEnsResolution(state) {
  return state.metamask.send.ensResolution;
}

export function getSendEnsResolutionError(state) {
  return state.metamask.send.ensResolutionError;
}

export function getUnapprovedTxs(state) {
  return state.metamask.unapprovedTxs;
}

export function getQrCodeData(state) {
  return state.appState.qrCodeData;
}

export function getGasLoadingError(state) {
  return state.send.errors.gasLoading;
}

export function gasFeeIsInError(state) {
  return Boolean(state.send.errors.gasFee);
}

export function getGasButtonGroupShown(state) {
  return state.send.gasButtonGroupShown;
}

export function getTitleKey(state) {
  const isEditing = Boolean(getSendEditingTransactionId(state));
  const asset = getSendAsset(state);

  if (!getSendTo(state)) {
    return 'addRecipient';
  }

  if (isEditing) {
    return 'edit';
  }

  switch (asset?.type) {
    case ASSET_TYPE.NATIVE:
    case ASSET_TYPE.NATIVE2:
      return 'send';
    case ASSET_TYPE.TOKEN:
      return 'sendTokens';
    case ASSET_TYPE.NFT:
      return 'send';
    default:
      return 'send';
  }
}

export function isSendFormInError(state) {
  return Object.values(getSendErrors(state)).some((n) => n);
}
