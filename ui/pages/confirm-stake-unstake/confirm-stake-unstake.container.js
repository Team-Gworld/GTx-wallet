import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { ASSET_MODE, ASSET_TYPE } from '../../../shared/constants/transaction';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { updateSend, showSendTokenPage } from '../../store/actions';
import { sendTokenTokenAmountAndToAddressSelector } from '../../selectors';
import { stakeInfoFromTxData } from '../send/send.utils';
import ConfirmStakeUnstake from './confirm-stake-unstake.component';

const mapStateToProps = (state) => {
  const { tokenAmount } = sendTokenTokenAmountAndToAddressSelector(state);
  const { action } =
    stakeInfoFromTxData(state.confirmTransaction?.txData) || {};

  return {
    tokenAmount,
    action,
    tokens: state.metamask.tokens,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: ({ txData, tokenProps }, tokens) => {
      const { id, txParams: { from, gas: gasLimit, gasPrice } = {} } = txData;
      const {
        tokenSymbol,
        tokenAddress,
        tokenAmount,
        toAddress,
        assetType,
        assetMode,
        stake,
        stakeToken,
      } = stakeInfoFromTxData(txData) || {};
      const tokenAddressLC = tokenAddress?.toLowerCase();

      let tokenEx;
      if (assetType === ASSET_TYPE.TOKEN) {
        if (assetMode === ASSET_MODE.UNSTAKE) {
          tokenEx = stakeToken;
        } else {
          tokenEx = tokens.find(({ address }) => address === tokenAddressLC);
        }
      }

      dispatch(
        updateSend({
          from,
          gasLimit,
          gasPrice,
          gasTotal: null,
          to: toAddress,
          amount: tokenAmount,
          errors: { to: null, amount: null, holder: null },
          editingTransactionId: id && id.toString(),
          asset: {
            ...tokenProps,
            symbol: tokenSymbol,
            address: tokenAddressLC,
            ...tokenEx,
            type: assetType,
            mode: assetMode,
            stake,
          },
        }),
      );
      dispatch(clearConfirmTransaction());
      dispatch(showSendTokenPage());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmStakeUnstake);
