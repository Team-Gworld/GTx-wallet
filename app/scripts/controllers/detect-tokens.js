import https from 'https';
import Web3 from 'web3';
import { warn } from 'loglevel';
import SINGLE_CALL_BALANCES_ABI from 'single-call-balance-checker-abi';
import contracts from '../../../gtx/mergedTokens';
import gtxTokensInitial from '../../../gtx/gtx-tokens.json';
import thetaTokens from '../../../gtx/theta-tokens.json';
import { normalizeTokenLogoUrl } from '../../../ui/helpers/utils/token-util';
import { MAINNET_CHAIN_ID, THETAMAINNET_CHAIN_ID } from './network/enums';
import { SINGLE_CALL_BALANCES_ADDRESSES } from './network/contract-addresses';

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000;

window.gtxTokens = gtxTokensInitial;

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
export default class DetectTokensController {
  /**
   * Creates a DetectTokensController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor({
    interval = DEFAULT_INTERVAL,
    preferences,
    network,
    keyringMemStore,
  } = {}) {
    this.preferences = preferences;
    this.interval = interval;
    this.network = network;
    this.keyringMemStore = keyringMemStore;
    this.fetchedGtxList = null;
    this.fetchedOtherList = null;
    this.tokenAddresses = [];
  }

  async fetchJSON(url) {
    return new Promise((resolve) => {
      https
        .get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              return resolve(JSON.parse(body));
            } catch (error) {
              console.error(error.message);
              return resolve(null);
            }
          });
        })
        .on('error', (error) => {
          console.error(error.message);
          return resolve(null);
        });
    });
  }

  async verifyGtxSigned(/* data, signature */) {
    return true; // skip for now
    /*
    const expectAddress = '0x1f26C8Be8871741a30D8837A6655EB55366bf1F9'
    try{
      if (!this.web3) return null
      const hash = this.web3.sha3(JSON.stringify(data))
      console.log(hash)
      const signingAddress = await this.web3.eth.accounts.recover(hash, signature) //returning error about callback
      return signingAddress.toLowerCase() === expectAddress.toLowerCase()
    } catch (err){
      console.error(err)
      return null
    }
    */
  }

  async updateGtxTokens() {
    const newGtxTokens =
      (await this.fetchJSON('https://gtx.io/wallet/gtx-tokens.json')) || {};
    if (
      typeof newGtxTokens === 'object' &&
      typeof newGtxTokens.tokens === 'object'
    ) {
      if (
        await this.verifyGtxSigned(newGtxTokens.tokens, newGtxTokens.signature)
      ) {
        this.fetchedGtxList = Date.now();
        if (Object.keys(newGtxTokens.tokens).length) {
          window.gtxTokens = newGtxTokens;
        }
      }
    }
  }

  async updateNonGtxTokens() {
    const newTokens =
      (await this.fetchJSON('https://gtx.io/wallet/new-tokens.json')) || {};
    if (typeof newTokens === 'object' && typeof newTokens.tokens === 'object') {
      if (await this.verifyGtxSigned(newTokens.tokens, newTokens.signature)) {
        this.fetchedOtherList = Date.now();
        if (Object.keys(newTokens.tokens).length) {
          window.otherTokens = newTokens;
        }
      }
    }
  }

  /**
   * For each token in @metamask/contract-metadata, find check selectedAddress balance.
   */
  async detectNewTokens() {
    if (!this._network || !this._network.store) {
      return;
    }
    const chainId = this._network.getCurrentChainId();
    if (!chainId || window.detectNewTokens_runningChainId === chainId) {
      return;
    }
    window.detectNewTokens_runningChainId = chainId;

    // ensure default tokens are all added
    let gtxTokensToUse = gtxTokensInitial;
    if (
      !this.fetchedGtxList ||
      Date.now() - this.fetchedGtxList >= 4 * 60 * 60 * 1000
    ) {
      await this.updateGtxTokens();
    }
    const gtxTokenData = { ...window.gtxTokens }; // TODO: remove window
    if (
      typeof gtxTokenData.tokens === 'object' &&
      Object.keys(gtxTokenData.tokens).length &&
      (await this.verifyGtxSigned(gtxTokenData.tokens, gtxTokenData.signature))
    ) {
      gtxTokensToUse = gtxTokenData.tokens;
    }
    gtxTokensToUse = { ...thetaTokens, ...gtxTokensToUse };
    if (
      typeof gtxTokensToUse === 'object' &&
      Object.keys(gtxTokensToUse).length
    ) {
      const proms = [];
      Object.keys(gtxTokensToUse).forEach((address) => {
        const t = gtxTokensToUse[address];
        if (!t.autoAdd) {
          return;
        }
        if (
          t.chainId === chainId ||
          (Array.isArray(t.chainId) && t.chainId.includes(chainId))
        ) {
          proms.push(
            this._preferences.addToken(
              address,
              t.symbol,
              t.decimals,
              normalizeTokenLogoUrl(t.logo),
              chainId,
              t.erc721,
              t.staking,
              t.stakedAsset,
              t.skipChainIds,
              t.unsendable,
            ),
          );
        }
      });
      await Promise.all(proms);
    }

    if (chainId !== MAINNET_CHAIN_ID && chainId !== THETAMAINNET_CHAIN_ID) {
      window.detectNewTokens_runningChainId = null;
      return;
    }

    // merge our custom updates list
    let contractsToUse = contracts;
    const newTokenData = window.otherTokens ? { ...window.otherTokens } : null;
    if (
      newTokenData &&
      typeof newTokenData.tokens === 'object' &&
      Object.keys(newTokenData.tokens).length &&
      (await this.verifyGtxSigned(newTokenData.tokens, newTokenData.signature))
    ) {
      contractsToUse = {
        ...contracts,
        ...newTokenData.tokens,
      };
    }

    const tokensToDetect = [];
    this.web3.setProvider(this._network._provider);
    for (const contractAddress in contractsToUse) {
      if (!contractsToUse.hasOwnProperty(contractAddress)) {
        continue;
      }
      const t = contractsToUse[contractAddress];
      if (
        t.erc20 &&
        !t.isNative2 &&
        !t.dontAutoDetect &&
        (t.chainId === chainId ||
          (Array.isArray(t.chainId) && t.chainId.includes(chainId))) &&
        !this.tokenAddresses.includes(contractAddress.toLowerCase())
      ) {
        tokensToDetect.push(contractAddress);
      }
    }

    let result;
    try {
      result = await this._getTokenBalances(tokensToDetect, chainId);
    } catch (error) {
      warn(
        `MetaMask - DetectTokensController single call balance fetch failed`,
        error,
      );
      window.detectNewTokens_runningChainId = null;
      return;
    }
    tokensToDetect.forEach((tokenAddress, index) => {
      const balance = result[index];
      if (balance && !balance.isZero()) {
        const t = contractsToUse[tokenAddress];
        this._preferences.addToken(
          tokenAddress,
          t.symbol,
          t.decimals,
          normalizeTokenLogoUrl(t.logo),
          t.chainId,
          t.erc721,
          t.staking,
          t.stakedAsset,
          t.skipChainIds,
          t.unsendable,
        );
      }
    });

    window.detectNewTokens_runningChainId = null;
  }

  async _getTokenBalances(tokens, chainId) {
    const address = SINGLE_CALL_BALANCES_ADDRESSES[chainId];
    if (!address) {
      throw new Error(`No single lookup contract for chainId ${chainId}`);
    }
    const ethContract = this.web3.eth
      .contract(SINGLE_CALL_BALANCES_ABI)
      .at(address);
    return new Promise((resolve, reject) => {
      ethContract.balances([this.selectedAddress], tokens, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
  }

  /**
   * Restart token detection polling period and call detectNewTokens
   * in case of address change or user session initialization.
   *
   */
  restartTokenDetection() {
    if (!(this.isActive && this.selectedAddress)) {
      return;
    }
    this.detectNewTokens();
    this.interval = DEFAULT_INTERVAL;
  }

  /**
   * @type {Number}
   */
  set interval(interval) {
    this._handle && clearInterval(this._handle);
    if (!interval) {
      return;
    }
    this._handle = setInterval(() => {
      this.detectNewTokens();
    }, interval);
  }

  /**
   * In setter when selectedAddress is changed, detectNewTokens and restart polling
   * @type {Object}
   */
  set preferences(preferences) {
    if (!preferences) {
      return;
    }
    this._preferences = preferences;
    const currentTokens = preferences.store.getState().tokens;
    this.tokenAddresses = currentTokens
      ? currentTokens.map((token) => token.address)
      : [];
    preferences.store.subscribe(({ tokens = [] }) => {
      this.tokenAddresses = tokens.map((token) => {
        return token.address;
      });
    });
    preferences.store.subscribe(({ selectedAddress }) => {
      if (this.selectedAddress !== selectedAddress) {
        this.selectedAddress = selectedAddress;
        this.restartTokenDetection();
      }
    });
  }

  /**
   * @type {Object}
   */
  set network(network) {
    if (!network) {
      return;
    }
    this._network = network;
    this.web3 = new Web3(network._provider);
  }

  /**
   * In setter when isUnlocked is updated to true, detectNewTokens and restart polling
   * @type {Object}
   */
  set keyringMemStore(keyringMemStore) {
    if (!keyringMemStore) {
      return;
    }
    this._keyringMemStore = keyringMemStore;
    this._keyringMemStore.subscribe(({ isUnlocked }) => {
      if (this.isUnlocked !== isUnlocked) {
        this.isUnlocked = isUnlocked;
        if (isUnlocked) {
          this.restartTokenDetection();
        }
      }
    });
  }

  /**
   * Internal isActive state
   * @type {Object}
   */
  get isActive() {
    return this.isOpen && this.isUnlocked;
  }
}
