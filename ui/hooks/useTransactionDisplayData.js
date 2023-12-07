import { useSelector } from 'react-redux';
import * as thetajs from '@thetalabs/theta-js';
import { getKnownMethodData } from '../selectors/selectors';
import {
  getTransactionActionKey,
  getStatusKey,
} from '../helpers/utils/transactions.util';
import { camelCaseToCapitalize } from '../helpers/utils/common.util';
import { PRIMARY, SECONDARY } from '../helpers/constants/common';
import { getTokenToAddress } from '../helpers/utils/token-util';
import {
  formatDateWithYearContext,
  shortenAddress,
  stripHttpSchemes,
} from '../helpers/utils/util';
import {
  TRANSACTION_CATEGORY_APPROVAL,
  TRANSACTION_CATEGORY_INTERACTION,
  TRANSACTION_CATEGORY_RECEIVE,
  TRANSACTION_CATEGORY_SEND,
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  TRANSACTION_CATEGORY_STAKE,
  TRANSACTION_CATEGORY_UNSTAKE,
  PENDING_STATUS_HASH,
  TOKEN_CATEGORY_HASH,
  TRANSACTION_CATEGORY_WRAP,
  TRANSACTION_CATEGORY_UNWRAP,
} from '../helpers/constants/transactions';
import { TRANSACTION_TYPE } from '../../shared/constants/transaction';
import { getTokens } from '../ducks/metamask/metamask';
import { THETA_SYMBOL } from '../../app/scripts/controllers/network/enums';
import { conversionUtil } from '../helpers/utils/conversion-util';
import {
  stakeInfoFromTxData,
  wrapInfoFromTxParams,
} from '../pages/send/send.utils';
import { useI18nContext } from './useI18nContext';
import { useTokenFiatAmount } from './useTokenFiatAmount';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';
import { useCurrencyDisplay } from './useCurrencyDisplay';
import { useTokenDisplayValue } from './useTokenDisplayValue';
import { useTokenData } from './useTokenData';

const ThetaTxType = thetajs.constants.TxType;

/**
 * @typedef {Object} TransactionDisplayData
 * @property {string} title                  - primary description of the transaction
 * @property {string} subtitle               - supporting text describing the transaction
 * @property {bool}   subtitleContainsOrigin - true if the subtitle includes the origin of the tx
 * @property {string} category               - the transaction category
 * @property {string} primaryCurrency        - the currency string to display in the primary position
 * @property {string} [secondaryCurrency]    - the currency string to display in the secondary position
 * @property {string} status                 - the status of the transaction
 * @property {string} senderAddress          - the Ethereum address of the sender
 * @property {string} recipientAddress       - the Ethereum address of the recipient
 */

/**
 * Get computed values used for displaying transaction data to a user
 *
 * The goal of this method is to perform all of the necessary computation and
 * state access required to take a transactionGroup and derive from it a shape
 * of data that can power all views related to a transaction. Presently the main
 * case is for shared logic between transaction-list-item and transaction-detail-view
 * @param {Object} transactionGroup group of transactions
 * @return {TransactionDisplayData}
 */
export function useTransactionDisplayData(transactionGroup) {
  const knownTokens = useSelector(getTokens);
  const t = useI18nContext();
  const { initialTransaction, primaryTransaction } = transactionGroup;
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  const { type } = initialTransaction;

  const { from: senderAddress, to } = initialTransaction.txParams || {};

  // for smart contract interactions, methodData can be used to derive the name of the action being taken
  const methodData =
    useSelector((state) =>
      getKnownMethodData(state, initialTransaction?.txParams?.data),
    ) || {};

  const actionKey = getTransactionActionKey(initialTransaction);
  const status = getStatusKey(primaryTransaction);

  let primaryValue = primaryTransaction.txParams?.value;
  const secondaryValue = primaryTransaction.txParams?.value2;
  let prefix = '-';
  const date = formatDateWithYearContext(initialTransaction.time || 0);
  let subtitle;
  let subtitleContainsOrigin = false;
  let recipientAddress = to;

  // This value is used to determine whether we should look inside txParams.data
  // to pull out and render token related information
  const isTokenCategory = TOKEN_CATEGORY_HASH[type];

  // these values are always instantiated because they are either
  // used by or returned from hooks. Hooks must be called at the top level,
  // so as an additional safeguard against inappropriately associating token
  // transfers, we pass an additional argument to these hooks that will be
  // false for non-token transactions. This additional argument forces the
  // hook to return null
  const token =
    isTokenCategory &&
    knownTokens.find(({ address }) => address === recipientAddress);
  const tokenData = useTokenData(
    initialTransaction?.txParams?.data,
    isTokenCategory,
  );
  const tokenDisplayValue = useTokenDisplayValue(
    initialTransaction?.txParams?.data,
    token,
    isTokenCategory,
  );
  const tokenFiatAmount = useTokenFiatAmount(
    token?.address,
    tokenDisplayValue,
    token?.symbol,
  );

  const origin = stripHttpSchemes(
    initialTransaction.origin || initialTransaction.msgParams?.origin || '',
  );

  let primarySuffix = isTokenCategory ? token?.symbol : undefined;
  const primaryDisplayValue = isTokenCategory ? tokenDisplayValue : undefined;
  const secondaryDisplayValue = isTokenCategory ? tokenFiatAmount : undefined;

  let category;
  let title;
  let altPrimary, altSecondary;

  // There are four types of transaction entries that are currently differentiated in the design
  // 1. signature request
  // 2. Send (sendEth sendTokens)
  // 3. Deposit
  // 4. Site interaction
  // 5. Approval
  if (type === null || type === undefined) {
    category = TRANSACTION_CATEGORY_SIGNATURE_REQUEST;
    title = t('signatureRequest');
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPE.TOKEN_METHOD_APPROVE) {
    category = TRANSACTION_CATEGORY_APPROVAL;
    title = t('approveSpendLimit', [token?.symbol || t('token')]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (
    type === TRANSACTION_TYPE.DEPLOY_CONTRACT ||
    type === TRANSACTION_TYPE.CONTRACT_INTERACTION
  ) {
    category = TRANSACTION_CATEGORY_INTERACTION;
    title =
      (methodData?.name && camelCaseToCapitalize(methodData.name)) ||
      (actionKey && t(actionKey)) ||
      '';
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TRANSACTION_TYPE.TOKEN_METHOD_WRAP) {
    const { tokenSymbol, tokenAmount } =
      wrapInfoFromTxParams(initialTransaction?.txParams) || {};
    category = TRANSACTION_CATEGORY_WRAP;
    title = t('wrap');
    primaryValue = tokenAmount;
    primarySuffix = tokenSymbol;
  } else if (type === TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP) {
    const { tokenSymbol, tokenAmount } =
      wrapInfoFromTxParams(initialTransaction?.txParams) || {};
    category = TRANSACTION_CATEGORY_UNWRAP;
    title = t('unwrap');
    primaryValue = tokenAmount;
    primarySuffix = tokenSymbol;
  } else if (type === TRANSACTION_TYPE.STAKE) {
    const { tokenSymbol, tokenAmount, label } =
      stakeInfoFromTxData(initialTransaction) || {};
    category = TRANSACTION_CATEGORY_STAKE;
    title = t('stake');
    subtitle = label ? t(label, [shortenAddress(recipientAddress)]) : '';
    if (
      initialTransaction?.txParams?.thetaTxType === ThetaTxType.SmartContract
    ) {
      primaryValue = tokenAmount;
      primarySuffix = tokenSymbol;
      altSecondary = '';
    }
  } else if (type === TRANSACTION_TYPE.UNSTAKE) {
    const { tokenSymbol, tokenAmount, hasShares, label, stakeToken } =
      stakeInfoFromTxData(initialTransaction) || {};
    category = TRANSACTION_CATEGORY_UNSTAKE;
    title = t('unstake');
    subtitle = label ? t(label, [shortenAddress(recipientAddress)]) : '';
    altSecondary = '';
    if (
      initialTransaction?.txParams?.thetaTxType === ThetaTxType.SmartContract
    ) {
      primaryValue = tokenAmount;
      primarySuffix = hasShares ? stakeToken.symbol : tokenSymbol;
    } else {
      altPrimary = t('allOfToken', [tokenSymbol]);
    }
  } else if (type === TRANSACTION_TYPE.INCOMING) {
    category = TRANSACTION_CATEGORY_RECEIVE;
    title = t('receive');
    prefix = '';
    subtitle = t('fromAddress', [shortenAddress(senderAddress)]);
  } else if (
    type === TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM ||
    type === TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER
  ) {
    category = TRANSACTION_CATEGORY_SEND;
    title = t('sendSpecifiedTokens', [token?.symbol || t('token')]);
    recipientAddress = getTokenToAddress(tokenData.params);
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
    if (token.isERC721) {
      altPrimary = `#${primaryDisplayValue}${token ? ` ${token.symbol}` : ''}`;
    }
  } else if (type === TRANSACTION_TYPE.SENT_ETHER) {
    category = TRANSACTION_CATEGORY_SEND;
    title = t('sendETH');
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  }

  const primaryCurrencyPreferences = useUserPreferencedCurrency(PRIMARY);
  let secondaryCurrencyPreferences = useUserPreferencedCurrency(SECONDARY);
  if (secondaryValue) {
    secondaryCurrencyPreferences = {
      currency: THETA_SYMBOL,
      numberOfDecimals: primaryCurrencyPreferences.numberOfDecimals,
    };
  }

  const [primaryCurrency] = useCurrencyDisplay(primaryValue, {
    prefix,
    displayValue: primaryDisplayValue,
    suffix: primarySuffix,
    ...primaryCurrencyPreferences,
  });

  const [secondaryCurrency] = useCurrencyDisplay(
    secondaryValue || primaryValue,
    {
      prefix,
      displayValue:
        secondaryValue && secondaryValue.slice(0, 2) === '0x'
          ? conversionUtil(secondaryValue, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              fromDenomination: 'WEI',
              numberOfDecimals:
                secondaryCurrencyPreferences?.numberOfDecimals || 2,
            })
          : secondaryDisplayValue,
      hideLabel: isTokenCategory ? true : undefined,
      ...secondaryCurrencyPreferences,
    },
  );

  if (
    type === TRANSACTION_TYPE.STAKE &&
    initialTransaction?.txParams?.thetaTxType !== ThetaTxType.SmartContract &&
    secondaryValue &&
    secondaryValue !== '0x' &&
    secondaryValue !== '0x0'
  ) {
    altPrimary = secondaryCurrency;
    altSecondary = '';
  }

  return {
    title,
    category,
    date,
    subtitle,
    subtitleContainsOrigin,
    primaryCurrency,
    altPrimary,
    senderAddress,
    recipientAddress,
    secondaryCurrency:
      (isTokenCategory && !tokenFiatAmount) ||
      ((type === TRANSACTION_TYPE.STAKE || type === TRANSACTION_TYPE.UNSTAKE) &&
        initialTransaction?.txParams?.thetaTxType === ThetaTxType.SmartContract)
        ? undefined
        : secondaryCurrency,
    altSecondary,
    status,
    isPending: status in PENDING_STATUS_HASH,
  };
}
