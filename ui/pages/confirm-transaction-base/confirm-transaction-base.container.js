import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import * as thetajs from '@thetalabs/theta-js';
import thetaTokens from '../../../gtx/theta-tokens.json';
import * as theta from '../../../shared/constants/theta';
import contractMap from '../../../gtx/mergedTokens';
import {
  TFUEL_TOKEN_IMAGE_URL,
  THETA_TOKEN_IMAGE_URL,
} from '../../../app/scripts/controllers/network/enums';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  updateCustomNonce,
  cancelTx,
  cancelTxs,
  updateAndApproveTx,
  showModal,
  updateTransaction,
  getNextNonce,
  tryReverseResolveAddress,
} from '../../store/actions';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
} from '../../helpers/constants/error-keys';
import { getHexGasTotal } from '../../helpers/utils/confirm-tx.util';
import { isBalanceSufficient, calcGasTotal } from '../send/send.utils';
import { conversionGreaterThan } from '../../helpers/utils/conversion-util';
import { MIN_GAS_LIMIT_DEC } from '../send/send.constants';
import {
  checksumAddress,
  shortenAddress,
  valuesFor,
} from '../../helpers/utils/util';
import {
  getAdvancedInlineGasShown,
  getCustomNonceValue,
  getIsMainnet,
  getKnownMethodData,
  getMetaMaskAccounts,
  getUseNonceField,
  transactionFeeSelector,
  getShouldShowFiat,
} from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { transactionMatchesNetwork } from '../../lib/tx-helper';
import ConfirmTransactionBase from './confirm-transaction-base.component';

const { TxType: ThetaTxType, StakePurpose } = thetajs.constants;
const casedContractMap = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  };
}, {});

let customNonceValue = '';
const customNonceMerge = (txData) =>
  customNonceValue
    ? {
        ...txData,
        customNonceValue,
      }
    : txData;

const mapStateToProps = (state, ownProps) => {
  const {
    toAddress: propsToAddress,
    customTxParamsData,
    match: { params = {} },
    action,
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const shouldShowFiat = getShouldShowFiat(state);
  const showFiatForGas = shouldShowFiat;
  let hideFiatConversion = !shouldShowFiat;
  const isMainnet = getIsMainnet(state);
  const { confirmTransaction, metamask } = state;
  const {
    ensResolutionsByAddress,
    conversionRate,
    identities,
    addressBook,
    assetImages,
    network,
    unapprovedTxs,
    nextNonce,
    provider: { chainId, rpcPrefs: { selectedNative } = {} } = {},
  } = metamask;
  const { tokenData, txData, tokenProps, nonce } = confirmTransaction;
  const { txParams = {}, lastGasPriceParams, id: transactionId, type } = txData;
  const transaction =
    Object.values(unapprovedTxs).find(
      ({ id }) => id === (transactionId || Number(paramsTransactionId)),
    ) || {};
  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: gasLimit,
    value: amount,
    data,
    thetaTxType,
    additional: { purpose } = {},
  } = transaction?.txParams || txParams;
  const accounts = getMetaMaskAccounts(state);

  let assetImage;
  switch (thetaTxType) {
    case ThetaTxType.DepositStake:
    case ThetaTxType.DepositStakeV2:
    case ThetaTxType.WithdrawStake:
      assetImage =
        purpose === StakePurpose.StakeForEliteEdge
          ? TFUEL_TOKEN_IMAGE_URL
          : THETA_TOKEN_IMAGE_URL;
      break;
    default: {
      const fxSig = data?.slice(0, 10);
      if (fxSig === theta.fourBytes.deposit) {
        // wrapping should show input currency, not token image, if available
        switch (txParamsToAddress) {
          case theta.contracts.WTFUEL:
            assetImage = TFUEL_TOKEN_IMAGE_URL;
            break;
          case theta.contracts.WTHETA:
            assetImage = THETA_TOKEN_IMAGE_URL;
            break;
          default:
            assetImage = assetImages[txParamsToAddress];
        }
      } else if (fxSig === theta.fourBytes.withdraw) {
        switch (txParamsToAddress) {
          case theta.contracts.WTFUEL:
            hideFiatConversion = true;
            break;
          case theta.contracts.WTHETA:
            hideFiatConversion = true;
            break;
          default:
        }
      } else {
        assetImage =
          (fxSig ===
            thetaTokens[thetaTokens[txParamsToAddress]?.stakedAsset?.address]
              ?.staking?.functionSigs?.stake &&
            assetImages[
              thetaTokens[txParamsToAddress]?.stakedAsset?.address.toLowerCase()
            ]) ||
          assetImages[txParamsToAddress];
      }
    }
  }
  const { balance } = accounts[fromAddress];
  const { name: fromName } = identities[fromAddress];
  const toAddress = propsToAddress || txParamsToAddress;

  const toName =
    identities[toAddress]?.name ||
    casedContractMap[toAddress]?.name ||
    shortenAddress(checksumAddress(toAddress));

  const checksummedAddress = checksumAddress(toAddress);
  const addressBookObject = addressBook[checksummedAddress];
  const toEns = ensResolutionsByAddress[checksummedAddress] || '';
  const toNickname = addressBookObject ? addressBookObject.name : '';
  const isTxReprice = Boolean(lastGasPriceParams);
  const transactionStatus = transaction ? transaction.status : '';

  const {
    hexTransactionAmount,
    hexTransactionAmount2,
    hexTransactionFee,
    hexTransactionTotal,
  } = transactionFeeSelector(state, transaction);

  if (transaction && transaction.simulationFails) {
    txData.simulationFails = transaction.simulationFails;
  }

  const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) =>
      transactionMatchesNetwork(
        unapprovedTxs[key],
        chainId,
        network,
        selectedNative,
      ),
    )
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {});
  const unapprovedTxCount = valuesFor(currentNetworkUnapprovedTxs).length;

  const insufficientBalance = !isBalanceSufficient({
    amount,
    gasTotal: calcGasTotal(gasLimit, maxFeePerGas ?? gasPrice),
    balance,
    conversionRate,
  });

  const methodData = getKnownMethodData(state, data) || {};
  const gasPriceParams = {
    ...(maxFeePerGas && {
      maxFeePerGas,
      maxPriorityFeePerGas,
    }),
    ...(!maxFeePerGas && {
      gasPrice,
    }),
  };

  let fullTxData = { ...txData, ...transaction };
  if (customTxParamsData) {
    fullTxData = {
      ...fullTxData,
      txParams: {
        ...fullTxData.txParams,
        data: customTxParamsData,
      },
    };
  }

  return {
    balance,
    fromAddress,
    fromName,
    toAddress,
    toEns,
    toName,
    toNickname,
    hexTransactionAmount,
    hexTransactionAmount2,
    hexTransactionFee,
    hexTransactionTotal,
    txData: fullTxData,
    tokenData,
    methodData,
    tokenProps,
    isTxReprice,
    conversionRate,
    transactionStatus,
    nonce,
    assetImage,
    unapprovedTxs,
    unapprovedTxCount,
    currentNetworkUnapprovedTxs,
    customGas: {
      gasLimit,
      gasPriceParams,
    },
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    useNonceField: getUseNonceField(state),
    customNonceValue: getCustomNonceValue(state),
    insufficientBalance,
    hideSubtitle: !shouldShowFiat,
    hideFiatConversion,
    showFiatForGas,
    type,
    nextNonce,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    isMainnet,
    action,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
    updateCustomNonce: (value) => {
      customNonceValue = value;
      dispatch(updateCustomNonce(value));
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showTransactionConfirmedModal: ({ onSubmit }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onSubmit }));
    },
    showCustomizeGasModal: ({ txData, onSubmit, validate }) => {
      return dispatch(
        showModal({ name: 'CUSTOMIZE_GAS', txData, onSubmit, validate }),
      );
    },
    updateGasAndCalculate: (updatedTx) => {
      return dispatch(updateTransaction(updatedTx));
    },
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount,
    }) => {
      return dispatch(
        showModal({ name: 'REJECT_TRANSACTIONS', onSubmit, unapprovedTxCount }),
      );
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    cancelAllTransactions: (txList) => dispatch(cancelTxs(txList)),
    sendTransaction: (txData) =>
      dispatch(updateAndApproveTx(customNonceMerge(txData))),
    getNextNonce: () => dispatch(getNextNonce()),
  };
};

const getValidateEditGas = ({ balance, conversionRate, txData }) => {
  const { txParams: { value: amount } = {} } = txData;

  return ({ gasLimit, gasPriceParams }) => {
    const gasTotal = getHexGasTotal({
      gasLimit,
      gasPrice: gasPriceParams.maxFeePerGas ?? gasPriceParams.gasPrice,
    });
    const hasSufficientBalance = isBalanceSufficient({
      amount,
      gasTotal,
      balance,
      conversionRate,
    });

    if (!hasSufficientBalance) {
      return {
        valid: false,
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      };
    }

    const gasLimitTooLow =
      gasLimit &&
      conversionGreaterThan(
        {
          value: MIN_GAS_LIMIT_DEC,
          fromNumericBase: 'dec',
          conversionRate,
        },
        {
          value: gasLimit,
          fromNumericBase: 'hex',
        },
      );

    if (gasLimitTooLow) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      };
    }

    return {
      valid: true,
    };
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { balance, conversionRate, txData, unapprovedTxs } = stateProps;
  const {
    cancelAllTransactions: dispatchCancelAllTransactions,
    showCustomizeGasModal: dispatchShowCustomizeGasModal,
    updateGasAndCalculate: dispatchUpdateGasAndCalculate,
    ...otherDispatchProps
  } = dispatchProps;

  const validateEditGas = getValidateEditGas({
    balance,
    conversionRate,
    txData,
  });

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    showCustomizeGasModal: () =>
      dispatchShowCustomizeGasModal({
        txData,
        onSubmit: (customGas) => dispatchUpdateGasAndCalculate(customGas),
        validate: validateEditGas,
      }),
    cancelAllTransactions: () =>
      dispatchCancelAllTransactions(valuesFor(unapprovedTxs)),
    updateGasAndCalculate: ({ gasLimit, gasPriceParams }) => {
      const updatedTx = {
        ...txData,
        txParams: {
          ...txData.txParams,
          gas: gasLimit,
          ...gasPriceParams,
        },
      };
      dispatchUpdateGasAndCalculate(updatedTx);
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(ConfirmTransactionBase);
