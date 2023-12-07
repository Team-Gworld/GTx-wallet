import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import { normalize as normalizeAddress } from 'eth-sig-util';
import ethUtil from 'ethereumjs-util';

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000;

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
export default class TokenRatesController {
  /**
   * Creates a TokenRatesController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor({ currency, preferences } = {}) {
    this.store = new ObservableStore();
    this.currency = currency;
    this.preferences = preferences;
  }

  /**
   * Updates exchange rates for all tokens
   */
  async updateExchangeRates() {
    const minRefreshInterval = 15 * 1000;
    const {
      lastUpdatedExchangeRates,
      contractExchangeRates: lastContractExchangeRates,
    } = this.store.getState();
    if (
      !this._tokens?.length ||
      Date.now - (lastUpdatedExchangeRates || 0) < minRefreshInterval
    ) {
      if (lastContractExchangeRates === undefined) {
        this.store.putState({ contractExchangeRates: {} });
      }
      return;
    }
    const contractExchangeRates = {};
    const nativeCurrency = this.currency
      ? this.currency.state.nativeCurrency.toLowerCase()
      : 'eth';
    const pairs = this._tokens.map((token) => token.address).join(',');
    const query = `contract_addresses=${pairs}&vs_currencies=${nativeCurrency}`;
    try {
      const response = await window.fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?${query}`,
      );
      const prices = await response.json();
      this._tokens.forEach((token) => {
        const price =
          prices[token.address.toLowerCase()] ||
          prices[ethUtil.toChecksumAddress(token.address)];
        contractExchangeRates[normalizeAddress(token.address)] = price
          ? price[nativeCurrency]
          : 0;
      });
      this.store.putState({
        contractExchangeRates,
        lastUpdatedExchangeRates: Date.now(),
      });
    } catch (error) {
      log.warn(
        `MetaMask - TokenRatesController exchange rate fetch failed.`,
        error,
      );
      if (lastContractExchangeRates === undefined) {
        this.store.putState({ contractExchangeRates: {} });
      }
    }
  }

  /**
   * @type {Object}
   */
  set preferences(preferences) {
    this._preferences && this._preferences.unsubscribe();
    if (!preferences) {
      return;
    }
    this._preferences = preferences;
    this.tokens = preferences.getState().tokens;
    preferences.subscribe(({ tokens = [] }) => {
      this.tokens = tokens;
    });
  }

  /**
   * @type {Array}
   */
  set tokens(tokens) {
    this._tokens = tokens;
    this.updateExchangeRates();
  }

  start(interval = DEFAULT_INTERVAL) {
    this._handle && clearInterval(this._handle);
    if (!interval) {
      return;
    }
    this._handle = setInterval(() => {
      this.updateExchangeRates();
    }, interval);
    this.updateExchangeRates();
  }

  stop() {
    this._handle && clearInterval(this._handle);
  }
}
