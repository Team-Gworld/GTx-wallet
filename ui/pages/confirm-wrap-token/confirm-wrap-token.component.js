import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmWrapTransactionBase from '../confirm-wrap-transaction-base';
import { WRAP_ROUTE } from '../../helpers/constants/routes';

export default class ConfirmWrapToken extends Component {
  static propTypes = {
    history: PropTypes.object,
    editTransaction: PropTypes.func,
    tokenAmount: PropTypes.number,
    action: PropTypes.string,
  };

  handleEdit(confirmTransactionData) {
    const { editTransaction, history } = this.props;
    editTransaction(confirmTransactionData);
    if (history.location.pathname !== WRAP_ROUTE) {
      history.push(WRAP_ROUTE);
    }
  }

  render() {
    const { tokenAmount, action } = this.props;

    return (
      <ConfirmWrapTransactionBase
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
        tokenAmount={tokenAmount}
        action={action}
      />
    );
  }
}
