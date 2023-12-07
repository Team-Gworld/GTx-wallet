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
import { stakeInfoFromTxData } from '../send/send.utils';
import ConfirmStakeUnstakeTransactionBase from './confirm-stake-unstake-transaction-base.component';

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

  /*
  const tokens = getTokens(state)
  const currentToken = tokens && tokens.find(({ address }) => tokenAddress === address)
  const { decimals, symbol: tokenSymbol } = currentToken || {}

  const tokenData = getTokenData(data)
  const tokenValue = tokenData && getTokenValue(tokenData.params)
  const toAddress = tokenData && getTokenToAddress(tokenData.params)
  const tokenAmount = tokenData && calcTokenAmount(tokenValue, decimals).toNumber()
  */
  const contractExchangeRate = contractExchangeRateSelector(state);
  const nativeCurrencyImage = getNativeCurrencyImage(state);
  const nativeCurrency = getNativeCurrency(state);

  const { tokenSymbol, tokenAmount, toAddress, stakeToken } =
    stakeInfoFromTxData(confirmTransaction.txData) || {
      tokenSymbol: '',
      tokenAmount: '0x0',
      toAddress: '',
    };

  return {
    toAddress,
    tokenAddress: toAddress,
    tokenAmount: calcTokenAmount(tokenAmount, 18).toFixed(),
    tokenSymbol,
    stakeToken,
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
)(ConfirmStakeUnstakeTransactionBase);
