import assert from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import EthQuery from 'eth-query';
import { JsonRpcEngine } from 'json-rpc-engine';
import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import { addHexPrefix } from 'ethereumjs-util';
import { defaultNetworksData } from '../../../../ui/pages/settings/networks-tab/networks-tab.constants'; // TODO: move to shared constants file
import createMetamaskMiddleware from './createMetamaskMiddleware';
import createInfuraClient from './createInfuraClient';
import createJsonRpcClient from './createJsonRpcClient';
import createLocalhostClient from './createLocalhostClient';
import {
  // RINKEBY,
  // MAINNET,
  LOCALHOST,
  INFURA_PROVIDER_TYPES,
  THETAMAINNET_NETWORK_ID,
  MAINNET_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  GOERLI_NETWORK_ID,
  KOVAN_NETWORK_ID,
  THETAMAINNET_CHAIN_ID,
  THETAMAINNET_RPC_URL,
  TFUEL_SYMBOL,
  THETASC_DISPLAY_NAME,
  THETAMAINNET_EXPLORER_URL,
  THETAMAINNET_DISPLAY_NAME,
  NETWORK_TYPE_TO_ID_MAP,
} from './enums';

const networks = { networkList: {} };

// const env = process.env.METAMASK_ENV
// const METAMASK_DEBUG = process.env.METAMASK_DEBUG // eslint-disable-line prefer-destructuring
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID; // eslint-disable-line prefer-destructuring

/*
let defaultProviderConfigType
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigType = LOCALHOST
} else if (METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigType = RINKEBY
} else {
  defaultProviderConfigType = MAINNET
}

const defaultProviderConfig = {
  type: defaultProviderConfigType,
}
*/

const theta = defaultNetworksData.find((e) => e.labelKey === 'theta_mainnet');
export const defaultProviderConfig = {
  type: theta.providerType,
  rpcTarget: theta.rpcUrl,
  chainId: theta.chainId,
  ticker: theta.ticker,
  nickname: THETAMAINNET_DISPLAY_NAME,
  rpcPrefs: {
    blockExplorerUrl: theta.blockExplorerUrl,
    selectedNative: true,
  },
};
const defaultNetworkConfig = {
  ticker: theta.ticker,
};

export default class NetworkController extends EventEmitter {
  constructor(opts = {}) {
    super();

    // parse options
    const providerConfig = opts.provider || defaultProviderConfig;
    // create stores
    this.providerStore = new ObservableStore(providerConfig);
    this.networkStore = new ObservableStore('loading');
    this.networkConfig = new ObservableStore(defaultNetworkConfig);
    this.eip1559Compatible = new ObservableStore(false);
    this.store = new ComposedStore({
      provider: this.providerStore,
      network: this.networkStore,
      settings: this.networkConfig,
      eip1559Compatible: this.eip1559Compatible,
    });
    this.on('networkDidChange', this.lookupNetwork);
    // provider and block tracker
    this._provider = null;
    this._blockTracker = null;
    // provider and block tracker proxies - because the network changes
    this._providerProxy = null;
    this._blockTrackerProxy = null;
  }

  initializeProvider(providerParams) {
    this._baseProviderParams = providerParams;
    const { type, rpcTarget, chainId, ticker, nickname } =
      this.providerStore.getState();
    this._configureProvider({ type, rpcTarget, chainId, ticker, nickname });
    this.lookupNetwork();
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy;
    const blockTracker = this._blockTrackerProxy;
    return { provider, blockTracker };
  }

  verifyNetwork() {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) {
      this.lookupNetwork();
    }
  }

  getCurrentChainId() {
    const networkId = parseInt(this.getNetworkState(), 10);
    return networkId ? addHexPrefix(networkId.toString(16)) : undefined;
  }

  getNetworkState() {
    return this.networkStore.getState();
  }

  getNetworkConfig() {
    return this.networkConfig.getState();
  }

  setNetworkState(network, type) {
    if (network === 'loading') {
      this.networkStore.putState(network);
      return;
    }

    // type must be defined
    if (!type) {
      return;
    }
    this.networkStore.putState((type !== 'rpc' && networks.networkList[type]?.chainId) || parseInt(network).toString()); // eshint-disable-line radix
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading';
  }

  lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }
    const { type } = this.providerStore.getState();
    const ethQuery = new EthQuery(this._provider);
    const initialNetwork = this.getNetworkState();

    ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      const useNetwork = parseInt(network).toString(); //eslint-disable-line radix
      const currentNetwork = this.getNetworkState();
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading');
          return;
        }
        log.info(`web3.getNetwork returned ${network} (${useNetwork})`);

        let eip1559Compatible;
        switch (useNetwork) {
          case THETAMAINNET_NETWORK_ID:
            eip1559Compatible = false;
            break;
          case MAINNET_NETWORK_ID:
          case ROPSTEN_NETWORK_ID:
          case RINKEBY_NETWORK_ID:
          case GOERLI_NETWORK_ID:
          case KOVAN_NETWORK_ID:
            eip1559Compatible = true;
            break;
          default:
            eip1559Compatible = null;
        }
        if (eip1559Compatible === null) {
          // TODO: cache this info
          ethQuery.sendAsync(
            {
              method: 'eth_getBlockByNumber',
              params: ['latest', false], // no tx details
            },
            (err2, currentBlock) => {
              if (err2) {
                this.setNetworkState('loading');
                return;
              }
              eip1559Compatible = Boolean(currentBlock.baseFeePerGas);
              log.info(
                `Network ${
                  eip1559Compatible ? 'supports' : 'does not support'
                } EIP-1559`,
              );
              this.eip1559Compatible.putState(eip1559Compatible);
              this.setNetworkState(useNetwork, type);
            },
          );
        } else {
          log.info(
            `Network ${
              eip1559Compatible ? 'supports' : 'does not support'
            } EIP-1559`,
          );
          this.eip1559Compatible.putState(eip1559Compatible);
          this.setNetworkState(useNetwork, type);
        }
      }
    });
  }

  setSelectedNative(native_) {
    const { rpcPrefs } = this.providerStore.getState();
    if (rpcPrefs.selectedNative !== native_) {
      rpcPrefs.selectedNative = native_;
      this.providerStore.updateState({ rpcPrefs });
    }
  }

  getSelectedNative() {
    return this.providerStore.getState().rpcPrefs?.selectedNative;
  }

  switchToScMode() {
    this.setRpcTarget(
      THETAMAINNET_RPC_URL,
      THETAMAINNET_NETWORK_ID,
      TFUEL_SYMBOL,
      THETASC_DISPLAY_NAME,
      {
        blockExplorerUrl: THETAMAINNET_EXPLORER_URL,
        selectedNative: false,
      },
    );
  }

  setRpcTarget(rpcTarget, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    const providerConfig = {
      type: 'rpc',
      rpcTarget,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    };
    this.providerConfig = providerConfig;
  }

  async setProviderType(type, rpcTarget = '', ticker = 'ETH', nickname = '') {
    assert.notEqual(
      type,
      'rpc',
      `NetworkController - cannot call "setProviderType" with type 'rpc'. use "setRpcTarget"`,
    );
    assert(
      INFURA_PROVIDER_TYPES.includes(type) || type === LOCALHOST,
      `NetworkController - Unknown rpc type "${type}"`,
    );
    const providerConfig = { type, rpcTarget, ticker, nickname };
    this.providerConfig = providerConfig;
  }

  resetConnection() {
    this.providerConfig = this.getProviderConfig();
  }

  set providerConfig(providerConfig) {
    if (providerConfig && !providerConfig.rpcPrefs) {
      providerConfig.rpcPrefs = {};
    }
    this.providerStore.updateState(providerConfig);
    this._switchNetwork(providerConfig);
  }

  getProviderConfig() {
    return this.providerStore.getState();
  }

  //
  // Private
  //

  _switchNetwork(opts) {
    this.setNetworkState('loading');
    this._configureProvider(opts);
    this.emit('networkDidChange', opts.type);
  }

  _configureProvider(opts) {
    const { type, rpcTarget, chainId, ticker, nickname } = opts;
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);
    if (isInfura) {
      this._configureInfuraProvider({ type, projectId: INFURA_PROJECT_ID });
      // other type-based rpc endpoints
    } else if (type === LOCALHOST) {
      this._configureLocalhostProvider();
      // url-based rpc endpoints
    } else if (type === 'rpc') {
      this._configureStandardProvider({
        rpcUrl: rpcTarget,
        chainId,
        ticker,
        nickname,
      });
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      );
    }
  }

  _configureInfuraProvider({ type, projectId }) {
    log.info('NetworkController - configureInfuraProvider', type);
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    });
    this._setNetworkClient(networkClient);
    // setup networkConfig
    const settings = {
      ticker: 'ETH',
      network: NETWORK_TYPE_TO_ID_MAP[type].networkId,
    };
    this.networkConfig.putState(settings);
  }

  _configureLocalhostProvider() {
    log.info('NetworkController - configureLocalhostProvider');
    const networkClient = createLocalhostClient();
    this._setNetworkClient(networkClient);
  }

  _configureStandardProvider({ rpcUrl, chainId, ticker, nickname }) {
    log.info('NetworkController - configureStandardProvider', rpcUrl);
    const networkClient = createJsonRpcClient({ rpcUrl });
    // hack to add a 'rpc' network with chainId
    networks.networkList.rpc = {
      chainId, // TODO: chainId and networkId are used ambiguously throughout the codebase. should get rid of networkId altogether and use only hex chainIds
      rpcUrl,
      ticker: ticker || 'ETH',
      nickname,
    };
    // setup networkConfig
    let settings = {
      network: chainId,
    };
    settings = Object.assign(settings, networks.networkList.rpc);
    this.networkConfig.putState(settings);
    this._setNetworkClient(networkClient);
  }

  _setNetworkClient({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(
      this._baseProviderParams,
    );
    const engine = new JsonRpcEngine();
    engine.push(metamaskMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or intialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider);
    } else {
      this._providerProxy = createSwappableProxy(provider);
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker);
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      });
    }
    // set new provider and blockTracker
    this._provider = provider;
    this._blockTracker = blockTracker;
  }
}
