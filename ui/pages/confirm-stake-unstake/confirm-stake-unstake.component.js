import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmStakeUnstakeTransactionBaseContainer from '../confirm-stake-unstake-transaction-base';
import { STAKE_ROUTE } from '../../helpers/constants/routes';

export default class ConfirmStakeUnstake extends Component {
  static propTypes = {
    history: PropTypes.object,
    editTransaction: PropTypes.func,
    tokenAmount: PropTypes.number,
    action: PropTypes.string,
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
      }),
    ).isRequired,
  };

  handleEdit(confirmTransactionData) {
    const { editTransaction, history, tokens } = this.props;
    editTransaction(confirmTransactionData, tokens);
    if (history.location.pathname !== STAKE_ROUTE) {
      history.push(STAKE_ROUTE);
    }
  }

  render() {
    const { tokenAmount, action } = this.props;

    return (
      <ConfirmStakeUnstakeTransactionBaseContainer
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
        tokenAmount={tokenAmount}
        action={action}
      />
    );
  }
}
