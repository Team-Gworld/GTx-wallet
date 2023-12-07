import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { isAssetTokenLike } from '../send.utils';

export default class SendFooter extends Component {
  static propTypes = {
    addToAddressBookIfNew: PropTypes.func,
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
    toAccounts: PropTypes.array,
    tokenBalance: PropTypes.string,
    unapprovedTxs: PropTypes.object,
    update: PropTypes.func,
    gasIsLoading: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    selectedNative: PropTypes.bool,
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
      addToAddressBookIfNew,
      amount,
      data,
      editingTransactionId,
      from: { address: from },
      gasLimit: gas,
      gasPriceParams,
      sendAsset,
      sign,
      to,
      unapprovedTxs,
      update,
      toAccounts,
      history,
      selectedNative,
    } = this.props;

    // Should not be needed because submit should be disabled if there are errors.
    // const noErrors = !amountError && toError === null

    // if (!noErrors) {
    //   return
    // }

    // TODO: add nickname functionality
    await addToAddressBookIfNew(to, toAccounts);
    const isThetaNative = selectedNative;
    const promise = editingTransactionId
      ? update({
          sendAsset,
          data,
          to,
          amount,
          from,
          gas,
          ...gasPriceParams,
          isThetaNative,
          editingTransactionId,
          unapprovedTxs,
        })
      : sign({
          data,
          sendAsset,
          to,
          amount,
          from,
          gas,
          gasPriceParams,
          isThetaNative,
        });

    Promise.resolve(promise).then(() => {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    });
  }

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
    } = this.props;
    const missingTokenBalance = isAssetTokenLike(sendAsset) && !tokenBalance;
    const gasLimitTooLow = gasLimit < 5208; // 5208 is hex value of 21000, minimum gas limit
    const shouldBeDisabled =
      inError ||
      !gasTotal ||
      missingTokenBalance ||
      !(data || to) ||
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
