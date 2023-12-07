import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { isAssetTokenLike } from '../../send/send.utils';

export default class WrapFooter extends Component {
  static propTypes = {
    amount: PropTypes.string,
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
      : sign({
          sendAsset,
          amount,
          from,
          gas,
          ...gasPriceParams,
        });

    Promise.resolve(promise).then(() => {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    });
  }

  formShouldBeDisabled() {
    const {
      inError,
      sendAsset,
      tokenBalance,
      gasTotal,
      gasLimit,
      gasIsLoading,
    } = this.props;
    const missingTokenBalance = isAssetTokenLike(sendAsset) && !tokenBalance;
    const gasLimitTooLow = gasLimit < 5208; // 5208 is hex value of 21000, minimum gas limit
    const shouldBeDisabled =
      inError ||
      !gasTotal ||
      missingTokenBalance ||
      gasLimitTooLow ||
      gasIsLoading;
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
