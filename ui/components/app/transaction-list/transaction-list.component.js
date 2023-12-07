import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import Button from '../../ui/button';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { TRANSACTION_TYPE } from '../../../../shared/constants/transaction';

const PAGE_INCREMENT = 10;

const getTransactionGroupRecipientAddressFilter = (recipientAddress) => {
  return ({ initialTransaction: { txParams } }) =>
    txParams && txParams.to === recipientAddress;
};

const getNative2Filter = (isNative2) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      (isNative2 && txParams?.value2 && txParams?.value2 !== '0x') ||
      (!isNative2 && (!txParams?.value2 || txParams?.value2 === '0x'))
    );
  };
};

const getStakingFilter = (showPurposes) => {
  return ({ initialTransaction: { type, txParams } }) => {
    return (
      (showPurposes &&
        (type === TRANSACTION_TYPE.STAKE ||
          type === TRANSACTION_TYPE.UNSTAKE) &&
        showPurposes?.includes(txParams.additional?.purpose)) ||
      (!showPurposes &&
        type !== TRANSACTION_TYPE.STAKE &&
        type !== TRANSACTION_TYPE.UNSTAKE)
    );
  };
};

const tokenTransactionFilter = ({ initialTransaction: { type } }) =>
  !TOKEN_CATEGORY_HASH[type];

const getFilteredTransactionGroups = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
  showNative2,
  showPurposes,
) => {
  let filteredTransactionGroups = transactionGroups;
  if (hideTokenTransactions) {
    filteredTransactionGroups = transactionGroups.filter(
      tokenTransactionFilter,
    );
  } else if (tokenAddress) {
    filteredTransactionGroups = transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress),
    );
  }
  if (typeof showNative2 !== 'undefined') {
    filteredTransactionGroups = filteredTransactionGroups.filter(
      getNative2Filter(showNative2),
    );
  }
  if (showPurposes !== null) {
    filteredTransactionGroups = filteredTransactionGroups.filter(
      getStakingFilter(showPurposes),
    );
  }
  return filteredTransactionGroups;
};

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
  showNative2,
  showHeader,
  showPurposes,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelector,
  );
  const unfilteredCompletedTransactions = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );

  const pendingTransactions = useMemo(
    () =>
      getFilteredTransactionGroups(
        unfilteredPendingTransactions,
        hideTokenTransactions,
        tokenAddress,
        showNative2,
        showPurposes,
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredPendingTransactions,
      showNative2,
      showPurposes,
    ],
  );
  const completedTransactions = useMemo(
    () =>
      getFilteredTransactionGroups(
        unfilteredCompletedTransactions,
        hideTokenTransactions,
        tokenAddress,
        showNative2,
        showPurposes,
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredCompletedTransactions,
      showNative2,
      showPurposes,
    ],
  );

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );

  const pendingLength = pendingTransactions.length;

  return (
    <div className="transaction-list">
      {showHeader && <h2>{t('transactions')}</h2>}
      <div className="transaction-list__transactions">
        {pendingLength > 0 && (
          <div className="transaction-list__pending-transactions">
            <div className="transaction-list__header">
              {`${t('queue')} (${pendingTransactions.length})`}
            </div>
            {pendingTransactions.map((transactionGroup, index) => (
              <TransactionListItem
                isEarliestNonce={index === 0}
                transactionGroup={transactionGroup}
                key={`${transactionGroup.nonce}:${index}`}
              />
            ))}
          </div>
        )}
        <div className="transaction-list__completed-transactions">
          {pendingLength > 0 ? (
            <div className="transaction-list__header">{t('history')}</div>
          ) : null}
          {completedTransactions.length > 0 ? (
            completedTransactions
              .slice(0, limit)
              .map((transactionGroup, index) => (
                <TransactionListItem
                  transactionGroup={transactionGroup}
                  key={`${transactionGroup.nonce}:${limit + index - 10}`}
                />
              ))
          ) : (
            <div className="transaction-list__empty">
              <div className="transaction-list__empty-text">
                {t('noTransactions')}
              </div>
            </div>
          )}
          {completedTransactions.length > limit && (
            <Button
              className="transaction-list__view-more"
              type="secondary"
              rounded
              onClick={viewMore}
            >
              View More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
  showNative2: PropTypes.bool,
  showPurposes: PropTypes.any,
  showHeader: PropTypes.bool,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
  showNative2: undefined,
  showPurposes: false,
  showHeader: false,
};
