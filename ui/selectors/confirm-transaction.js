import { createSelector } from 'reselect';
import txHelper, { transactionMatchesNetwork } from '../lib/tx-helper';
import { calcTokenAmount } from '../helpers/utils/token-util';
import {
  roundExponential,
  getValueFromWeiHex,
  getHexGasTotal,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import { sumHexes } from '../helpers/utils/transactions.util';
import { TRANSACTION_TYPE } from '../../shared/constants/transaction';
import {
  THETA_GASPRICE_HEXWEI,
  THETA_GAS_PER_TRANSFER_HEXWEI,
} from '../../app/scripts/controllers/network/enums';
import { getNativeCurrency } from '.';

const unapprovedTxsSelector = (state) => state.metamask.unapprovedTxs;
const unapprovedMsgsSelector = (state) => state.metamask.unapprovedMsgs;
const unapprovedPersonalMsgsSelector = (state) =>
  state.metamask.unapprovedPersonalMsgs;
const unapprovedDecryptMsgsSelector = (state) =>
  state.metamask.unapprovedDecryptMsgs;
const unapprovedEncryptionPublicKeyMsgsSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgs;
const unapprovedTypedMessagesSelector = (state) =>
  state.metamask.unapprovedTypedMessages;
const networkSelector = (state) => state.metamask.network;
const chainSelector = (state) => state.metamask.provider?.chainId;
const selectedNativeSelector = (state) =>
  state.metamask.provider?.rpcPrefs?.selectedNative;

export const unconfirmedTransactionsListSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  chainSelector,
  selectedNativeSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network,
    chainId,
    selectedNative,
  ) =>
    txHelper(
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedDecryptMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
      network,
      chainId,
      selectedNative,
    ) || [],
);

export const unconfirmedTransactionsHashSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  chainSelector,
  selectedNativeSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network,
    chainId,
    selectedNative,
  ) => {
    const filteredUnapprovedTxs = Object.keys(unapprovedTxs).reduce(
      (acc, address) => {
        const transactions = { ...acc };

        if (
          transactionMatchesNetwork(
            unapprovedTxs[address],
            chainId,
            network,
            selectedNative,
          )
        ) {
          transactions[address] = unapprovedTxs[address];
        }

        return transactions;
      },
      {},
    );

    return {
      ...filteredUnapprovedTxs,
      ...unapprovedMsgs,
      ...unapprovedPersonalMsgs,
      ...unapprovedDecryptMsgs,
      ...unapprovedEncryptionPublicKeyMsgs,
      ...unapprovedTypedMessages,
    };
  },
);

const unapprovedMsgCountSelector = (state) => state.metamask.unapprovedMsgCount;
const unapprovedPersonalMsgCountSelector = (state) =>
  state.metamask.unapprovedPersonalMsgCount;
const unapprovedDecryptMsgCountSelector = (state) =>
  state.metamask.unapprovedDecryptMsgCount;
const unapprovedEncryptionPublicKeyMsgCountSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgCount;
const unapprovedTypedMessagesCountSelector = (state) =>
  state.metamask.unapprovedTypedMessagesCount;

export const unconfirmedTransactionsCountSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgCountSelector,
  unapprovedPersonalMsgCountSelector,
  unapprovedDecryptMsgCountSelector,
  unapprovedEncryptionPublicKeyMsgCountSelector,
  unapprovedTypedMessagesCountSelector,
  networkSelector,
  chainSelector,
  selectedNativeSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    network,
    chainId,
    selectedNative,
  ) => {
    const filteredUnapprovedTxIds = Object.keys(unapprovedTxs).filter((txId) =>
      transactionMatchesNetwork(
        unapprovedTxs[txId],
        chainId,
        network,
        selectedNative,
      ),
    );

    return (
      filteredUnapprovedTxIds.length +
      unapprovedTypedMessagesCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount
    );
  },
);

export const currentCurrencySelector = (state) =>
  state.metamask.currentCurrency;
export const conversionRateSelector = (state) => state.metamask.conversionRate;

export const txDataSelector = (state) => state.confirmTransaction.txData;
const tokenDataSelector = (state) => state.confirmTransaction.tokenData;
const tokenPropsSelector = (state) => state.confirmTransaction.tokenProps;

const contractExchangeRatesSelector = (state) =>
  state.metamask.contractExchangeRates;

const tokenDecimalsSelector = createSelector(
  tokenPropsSelector,
  (tokenProps) => tokenProps && tokenProps.tokenDecimals,
);

const tokenDataParamsSelector = createSelector(
  tokenDataSelector,
  (tokenData) => (tokenData && tokenData.params) || [],
);

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => (txData && txData.txParams) || {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams && txParams.to,
);

const TOKEN_PARAM_SPENDER = '_spender';
const TOKEN_PARAM_TO = '_to';
const TOKEN_PARAM_VALUE = '_value';

export const tokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = '';
    let tokenAmount = 0;

    if (params && params.length) {
      const toParam = params.find((param) => param.name === TOKEN_PARAM_TO);
      const valueParam = params.find(
        (param) => param.name === TOKEN_PARAM_VALUE,
      );
      toAddress = toParam ? toParam.value : params[0].value;
      const value = valueParam
        ? Number(valueParam.value)
        : Number(params[1].value);

      if (tokenDecimals) {
        tokenAmount = calcTokenAmount(value, tokenDecimals).toNumber();
      }

      tokenAmount = roundExponential(tokenAmount);
    }

    return {
      toAddress,
      tokenAmount,
    };
  },
);

export const approveTokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = '';
    let tokenAmount = 0;

    if (params && params.length) {
      toAddress = params.find(
        (param) => param.name === TOKEN_PARAM_SPENDER,
      ).value;
      const value = Number(
        params.find((param) => param.name === TOKEN_PARAM_VALUE).value,
      );

      if (tokenDecimals) {
        tokenAmount = calcTokenAmount(value, tokenDecimals).toNumber();
      }

      tokenAmount = roundExponential(tokenAmount);
    }

    return {
      toAddress,
      tokenAmount,
    };
  },
);

export const sendTokenTokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = '';
    let tokenAmount = 0;

    if (params && params.length) {
      toAddress = params.find((param) => param.name === TOKEN_PARAM_TO).value;
      let value = Number(
        params.find((param) => param.name === TOKEN_PARAM_VALUE).value,
      );

      if (tokenDecimals) {
        value = calcTokenAmount(value, tokenDecimals).toNumber();
      }

      tokenAmount = roundExponential(value);
    }

    return {
      toAddress,
      tokenAmount,
    };
  },
);

export const contractExchangeRateSelector = createSelector(
  contractExchangeRatesSelector,
  tokenAddressSelector,
  (contractExchangeRates, tokenAddress) => contractExchangeRates[tokenAddress],
);

export const transactionFeeSelector = function (state, txData) {
  const currentCurrency = currentCurrencySelector(state);
  const conversionRate = conversionRateSelector(state);
  const nativeCurrency = getNativeCurrency(state);

  const {
    txParams: {
      value = '0x0',
      value2,
      gas: gasLimit = '0x0',
      gasPrice = '0x0',
      maxFeePerGas,
      isThetaNative,
    } = {},
  } = txData;

  const fiatTransactionAmount = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });
  const ethTransactionAmount = getValueFromWeiHex({
    value,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    conversionRate,
    numberOfDecimals: 6,
  });

  // TODO: check if this block can simply be removed without affecting functionality
  const isThetaNativeSend =
    isThetaNative && txData.type === TRANSACTION_TYPE.SENT_ETHER;
  const hexTransactionFee = getHexGasTotal({
    gasLimit: isThetaNativeSend ? THETA_GAS_PER_TRANSFER_HEXWEI : gasLimit,
    gasPrice: isThetaNativeSend
      ? THETA_GASPRICE_HEXWEI
      : maxFeePerGas || gasPrice,
  });

  const fiatTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });
  const ethTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });

  const fiatTransactionTotal = addFiat(
    fiatTransactionFee,
    fiatTransactionAmount,
  );
  const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
  const hexTransactionTotal = sumHexes(value, hexTransactionFee);

  return {
    hexTransactionAmount: value,
    hexTransactionAmount2: value2,
    fiatTransactionAmount,
    ethTransactionAmount,
    hexTransactionFee,
    fiatTransactionFee,
    ethTransactionFee,
    fiatTransactionTotal,
    ethTransactionTotal,
    hexTransactionTotal,
  };
};
