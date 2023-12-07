import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
  getNativeCurrencyImage,
  getNativeCurrency,
} from '../../selectors';
import { calcTokenAmount } from '../../helpers/utils/token-util';
import { wrapInfoFromTxParams } from '../send/send.utils';
import ConfirmWrapTransactionBase from './confirm-wrap-transaction-base.component';

const mapStateToProps = (state, ownProps) => {
  const {
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const {
    confirmTransaction,
    metamask: { currentCurrency, conversionRate, currentNetworkTxList },
  } = state;

  const { txData: { id: transactionId } = {} } = confirmTransaction;

  const transaction =
    currentNetworkTxList.find(
      ({ id }) => id === (Number(paramsTransactionId) || transactionId),
    ) || {};

  const { ethTransactionTotal, fiatTransactionTotal } = transactionFeeSelector(
    state,
    transaction,
  );

  const contractExchangeRate = contractExchangeRateSelector(state);
  const nativeCurrencyImage = getNativeCurrencyImage(state);
  const nativeCurrency = getNativeCurrency(state);

  const { tokenSymbol, tokenAmount, toAddress } = wrapInfoFromTxParams(
    confirmTransaction.txData?.txParams,
  ) || { tokenSymbol: '', tokenAmount: '0x0', toAddress: '' };

  return {
    toAddress,
    tokenAddress: toAddress,
    tokenAmount: calcTokenAmount(tokenAmount, 18).toFixed(),
    tokenSymbol,
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    ethTransactionTotal,
    nativeCurrencyImage,
    nativeCurrency,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ConfirmWrapTransactionBase);
