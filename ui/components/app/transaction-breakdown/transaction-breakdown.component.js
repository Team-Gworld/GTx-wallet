import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { THETA_SYMBOL } from '../../../../app/scripts/controllers/network/enums';
import CurrencyDisplay from '../../ui/currency-display';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import HexToDecimal from '../../ui/hex-to-decimal';
import { GWEI, PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import TransactionBreakdownRow from './transaction-breakdown-row';

export default class TransactionBreakdown extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    nativeCurrency: PropTypes.string,
    showFiat: PropTypes.bool,
    nonce: PropTypes.string,
    gas: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gasUsed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalInHex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    primaryCurrency: PropTypes.string,
    secondaryCurrency: PropTypes.string,
    isERC721: PropTypes.bool,
    isUnstakeCurrency: PropTypes.bool,
  };

  static defaultProps = {
    showFiat: true,
  };

  render() {
    const { t } = this.context;
    const {
      isERC721,
      gas,
      gasPrice,
      className,
      nonce,
      nativeCurrency,
      showFiat,
      totalInHex,
      gasUsed,
      primaryCurrency,
      secondaryCurrency,
      isUnstakeCurrency,
    } = this.props;
    return (
      <div className={classnames('transaction-breakdown', className)}>
        <div className="transaction-breakdown__title">{t('transaction')}</div>
        <TransactionBreakdownRow title="Nonce">
          {typeof nonce === 'undefined' ? null : (
            <HexToDecimal
              className="transaction-breakdown__value"
              value={nonce}
            />
          )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow title={t(isERC721 ? 'token' : 'amount')}>
          <span className="transaction-breakdown__value">
            {isERC721
              ? primaryCurrency.replace(/^-/u, '#')
              : (isUnstakeCurrency && t('all')) || primaryCurrency}
          </span>
          {secondaryCurrency &&
            secondaryCurrency !== primaryCurrency &&
            !isUnstakeCurrency && (
              <span className="transaction-breakdown__value">
                {secondaryCurrency}
              </span>
            )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow
          title={`${t('gasLimit')} (${t('units')})`}
          className="transaction-breakdown__row-title"
        >
          {typeof gas === 'undefined' ? (
            '?'
          ) : (
            <HexToDecimal
              className="transaction-breakdown__value"
              value={gas}
            />
          )}
        </TransactionBreakdownRow>
        {typeof gasUsed === 'string' && (
          <TransactionBreakdownRow
            title={`${t('gasUsed')} (${t('units')})`}
            className="transaction-breakdown__row-title"
          >
            <HexToDecimal
              className="transaction-breakdown__value"
              value={gasUsed}
            />
          </TransactionBreakdownRow>
        )}
        <TransactionBreakdownRow title={t('gasPrice')}>
          {typeof gasPrice === 'undefined' ? (
            '?'
          ) : (
            <CurrencyDisplay
              className="transaction-breakdown__value"
              data-testid="transaction-breakdown__gas-price"
              currency={nativeCurrency}
              denomination={GWEI}
              value={gasPrice}
              hideLabel
            />
          )}
        </TransactionBreakdownRow>
        <TransactionBreakdownRow title={t('total')}>
          <UserPreferencedCurrencyDisplay
            className="transaction-breakdown__value transaction-breakdown__value--eth-total"
            type={PRIMARY}
            value={totalInHex}
          />
          {primaryCurrency &&
            primaryCurrency?.split(' ')[1] !== nativeCurrency && (
              <UserPreferencedCurrencyDisplay
                className="transaction-breakdown__value transaction-breakdown__value--eth-total"
                type={PRIMARY}
                displayValue={primaryCurrency.replace(
                  /^-/u,
                  isERC721 ? '#' : '',
                )}
                suffix=""
                hideLabel
              />
            )}
          {secondaryCurrency &&
            secondaryCurrency !== primaryCurrency &&
            !isUnstakeCurrency &&
            secondaryCurrency.split(' ')[1] === THETA_SYMBOL && (
              <span className="transaction-breakdown__value transaction-breakdown__value--eth-total">
                {secondaryCurrency.replace(/^-/u, '')}
              </span>
            )}
          {showFiat && (
            <UserPreferencedCurrencyDisplay
              className="transaction-breakdown__value"
              type={SECONDARY}
              value={totalInHex}
            />
          )}
        </TransactionBreakdownRow>
      </div>
    );
  }
}
