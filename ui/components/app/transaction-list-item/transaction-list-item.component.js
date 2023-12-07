import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ListItem from '../../ui/list-item';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCancelTransaction } from '../../../hooks/useCancelTransaction';
import { useRetryTransaction } from '../../../hooks/useRetryTransaction';
import Button from '../../ui/button';
import Tooltip from '../../ui/tooltip';
import TransactionListItemDetails from '../transaction-list-item-details';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import {
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  UNAPPROVED_STATUS,
  TRANSACTION_CATEGORY_APPROVAL,
  FAILED_STATUS,
  DROPPED_STATUS,
  REJECTED_STATUS,
} from '../../../helpers/constants/transactions';
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp';
import TransactionStatus from '../transaction-status/transaction-status.component';
import TransactionIcon from '../transaction-icon';
import { THETAMAINNET_CHAIN_ID } from '../../../../app/scripts/controllers/network/enums';
import { getCurrentChainId } from '../../../selectors';

export default function TransactionListItem({
  transactionGroup,
  isEarliestNonce = false,
}) {
  const t = useI18nContext();
  const history = useHistory();
  const { hasCancelled } = transactionGroup;
  const [showDetails, setShowDetails] = useState(false);

  const {
    initialTransaction: { id },
    primaryTransaction: { err },
  } = transactionGroup;
  const [cancelEnabled, cancelTransaction] =
    useCancelTransaction(transactionGroup);
  const retryTransaction = useRetryTransaction(transactionGroup);
  let shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );
  let canShowCancel = true;
  const chainId = useSelector(getCurrentChainId);
  if (chainId === THETAMAINNET_CHAIN_ID) {
    shouldShowSpeedUp = false;
    canShowCancel = false;
  }

  const {
    title,
    subtitle,
    subtitleContainsOrigin,
    date,
    category,
    primaryCurrency,
    altPrimary,
    recipientAddress,
    secondaryCurrency,
    altSecondary,
    status,
    isPending,
    senderAddress,
  } = useTransactionDisplayData(transactionGroup);

  const isSignatureReq = category === TRANSACTION_CATEGORY_SIGNATURE_REQUEST;
  const isApproval = category === TRANSACTION_CATEGORY_APPROVAL;
  const isUnapproved = status === UNAPPROVED_STATUS;

  const className = classnames('transaction-list-item', {
    'transaction-list-item--unconfirmed':
      isPending ||
      [FAILED_STATUS, DROPPED_STATUS, REJECTED_STATUS].includes(status),
  });

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`);
      return;
    }
    setShowDetails((prev) => !prev);
  }, [isUnapproved, history, id]);

  const cancelButton = useMemo(() => {
    const btn = (
      <Button
        onClick={cancelTransaction}
        rounded
        className="transaction-list-item__header-button"
        disabled={!cancelEnabled}
      >
        {t('cancel')}
      </Button>
    );
    if (hasCancelled || !isPending || isUnapproved) {
      return null;
    }

    return cancelEnabled ? (
      btn
    ) : (
      <Tooltip title={t('notEnoughGas')} position="bottom">
        <div>{btn}</div>
      </Tooltip>
    );
  }, [
    isPending,
    t,
    isUnapproved,
    cancelEnabled,
    cancelTransaction,
    hasCancelled,
  ]);

  const speedUpButton = useMemo(() => {
    if (!shouldShowSpeedUp || !isPending || isUnapproved) {
      return null;
    }
    return (
      <Button
        type="secondary"
        rounded
        onClick={retryTransaction}
        className="transaction-list-item-details__header-button"
      >
        {t('speedUp')}
      </Button>
    );
  }, [shouldShowSpeedUp, isUnapproved, t, isPending, retryTransaction]);

  return (
    <>
      <ListItem
        onClick={toggleShowDetails}
        className={className}
        title={title}
        icon={<TransactionIcon category={category} status={status} />}
        subtitle={
          <h3>
            <TransactionStatus
              isPending={isPending}
              isEarliestNonce={isEarliestNonce}
              error={err}
              date={date}
              status={status}
            />
            <span
              className={
                subtitleContainsOrigin
                  ? 'transaction-list-item__origin'
                  : 'transaction-list-item__address'
              }
              title={subtitle}
            >
              {subtitle}
            </span>
          </h3>
        }
        rightContent={
          !isSignatureReq &&
          !isApproval && (
            <>
              <h2 className="transaction-list-item__primary-currency">
                {altPrimary ?? primaryCurrency}
              </h2>
              <h3 className="transaction-list-item__secondary-currency">
                {altSecondary ?? secondaryCurrency}
              </h3>
            </>
          )
        }
      >
        <div className="transaction-list-item__pending-actions">
          {speedUpButton}
          {canShowCancel && cancelButton}
        </div>
      </ListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          showRetry={status === FAILED_STATUS}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={canShowCancel && isPending && !hasCancelled}
          cancelDisabled={!cancelEnabled}
          primaryCurrency={primaryCurrency}
          secondaryCurrency={secondaryCurrency}
        />
      )}
    </>
  );
}

TransactionListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
};
