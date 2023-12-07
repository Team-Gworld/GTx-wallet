import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import {
  isAssetTokenLike,
  isTokenBalanceSufficient,
} from '../../send/send.utils';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../shared/constants/transaction';

export default class StakeFooter extends Component {
  static propTypes = {
    amount: PropTypes.string,
    data: PropTypes.string,
    clearSend: PropTypes.func,
    editingTransactionId: PropTypes.string,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPriceParams: PropTypes.object,
    gasTotal: PropTypes.string,
    history: PropTypes.object,
    inError: PropTypes.bool,
    sendAsset: PropTypes.object,
    sign: PropTypes.func,
    to: PropTypes.string,
    tokenBalance: PropTypes.string,
    unapprovedTxs: PropTypes.object,
    update: PropTypes.func,
    gasIsLoading: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onCancel() {
    const { clearSend, history, mostRecentOverviewPage } = this.props;
    clearSend();
    history.push(mostRecentOverviewPage);
  }

  async onSubmit(event) {
    event.preventDefault();
    const {
      sign,
      update,
      history,
      amount,
      editingTransactionId,
      from: { address: from },
      gasLimit: gas,
      gasPriceParams,
      sendAsset,
      unapprovedTxs,
    } = this.props;

    // Should not be needed because submit should be disabled if there are errors.
    // const noErrors = !amountError && toError === null

    // if (!noErrors) {
    //   return
    // }

    const promise = editingTransactionId
      ? update({
          sendAsset,
          amount,
          from,
          gas,
          ...gasPriceParams,
          editingTransactionId,
          unapprovedTxs,
        })
      : sign({ sendAsset, amount, from, gas, ...gasPriceParams });

    Promise.resolve(promise).then(() => {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    });
  }

  isAllowanceInsufficient = (sendAsset, amount) => {
    return (
      sendAsset.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.TOKEN &&
      !isTokenBalanceSufficient({
        tokenBalance: sendAsset.stakingAllowance ?? '0x0',
        amount,
        decimals: sendAsset.decimals,
      })
    );
  };

  formShouldBeDisabled() {
    const {
      data,
      inError,
      sendAsset,
      tokenBalance,
      gasTotal,
      to,
      gasLimit,
      gasIsLoading,
      amount,
    } = this.props;
    const missingTokenBalance = isAssetTokenLike(sendAsset) && !tokenBalance;
    const gasLimitTooLow = gasLimit < 5208; // 5208 is hex value of 21000, minimum gas limit
    const insufficientAllowance = this.isAllowanceInsufficient(
      sendAsset,
      amount,
    );
    const shouldBeDisabled =
      inError ||
      !gasTotal ||
      missingTokenBalance ||
      !(data || to) ||
      gasLimitTooLow ||
      gasIsLoading ||
      insufficientAllowance;
    return shouldBeDisabled;
  }

  render() {
    return (
      <PageContainerFooter
        onCancel={() => this.onCancel()}
        onSubmit={(e) => this.onSubmit(e)}
        disabled={this.formShouldBeDisabled()}
      />
    );
  }
}
