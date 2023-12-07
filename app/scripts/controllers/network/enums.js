const infuraProjectId = process.env.INFURA_PROJECT_ID;

const __THETA_NET_MODE__ = 'mainnet';
const __PRIVATENET_IP__ = '127.0.0.1'; // note: requires theta-ledger-explorer backend for full functionality

const THETA_NETWORKS = {
  privatenet: {
    networkId: '366',
    chainId: '0x16e',
    chainIdStr: 'privatenet',
    ethRpcUrl: `http://${__PRIVATENET_IP__}:18888/rpc`,
    nativeRpcUrl: `http://${__PRIVATENET_IP__}:16888/rpc`,
    explorerUrl: `http://${__PRIVATENET_IP__}:4000`,
    explorerApiUrl: `http://${__PRIVATENET_IP__}:8443`,
  },
  testnet: {
    networkId: '365',
    chainId: '0x16d',
    chainIdStr: 'testnet',
    ethRpcUrl: 'https://eth-rpc-api-testnet.thetatoken.org/rpc',
    nativeRpcUrl: 'https://theta-bridge-rpc-testnet.thetatoken.org/rpc',
    explorerUrl: 'https://testnet-explorer.thetatoken.org',
    explorerApiUrl: 'https://testnet-explorer.thetatoken.org:8443',
  },
  mainnet: {
    networkId: '361',
    chainId: '0x169',
    chainIdStr: 'mainnet',
    ethRpcUrl: 'https://theta-evm-rpc.gtx.io/rpc', // 'https://eth-rpc-api.thetatoken.org/rpc'
    nativeRpcUrl: 'https://theta-rpc.gtx.io/rpc', // 'https://theta-bridge-rpc.thetatoken.org/rpc'
    explorerUrl: 'https://explorer.thetatoken.org',
    explorerApiUrl: 'https://explorer.thetatoken.org:8443',
  },
};
const THETA_NETWORK = THETA_NETWORKS[__THETA_NET_MODE__];

export const ROPSTEN = 'ropsten';
export const RINKEBY = 'rinkeby';
export const KOVAN = 'kovan';
export const MAINNET = 'mainnet';
export const GOERLI = 'goerli';
export const THETAMAINNET = 'theta_mainnet';
export const THETASC = 'theta_sc';
export const LOCALHOST = 'localhost';

export const MAINNET_NETWORK_ID = '1';
export const ROPSTEN_NETWORK_ID = '3';
export const RINKEBY_NETWORK_ID = '4';
export const GOERLI_NETWORK_ID = '5';
export const KOVAN_NETWORK_ID = '42';
export const GANACHE_NETWORK_ID = '5777';
export const THETAMAINNET_NETWORK_ID = THETA_NETWORK.networkId;

export const MAINNET_CHAIN_ID = '0x1';
export const ROPSTEN_CHAIN_ID = '0x3';
export const RINKEBY_CHAIN_ID = '0x4';
export const GOERLI_CHAIN_ID = '0x5';
export const KOVAN_CHAIN_ID = '0x2a';
export const GANACHE_CHAIN_ID = '0x1691';
export const THETAMAINNET_CHAIN_ID = THETA_NETWORK.chainId;
export const THETAMAINNET_CHAIN_ID_STR = THETA_NETWORK.chainIdStr;

export const ROPSTEN_DISPLAY_NAME = 'Ropsten';
export const RINKEBY_DISPLAY_NAME = 'Rinkeby';
export const KOVAN_DISPLAY_NAME = 'Kovan';
export const MAINNET_DISPLAY_NAME = 'Ethereum Mainnet';
export const GOERLI_DISPLAY_NAME = 'Goerli';
export const THETAMAINNET_DISPLAY_NAME = 'Theta Native MN';
export const THETASC_DISPLAY_NAME = 'Theta SC MN';

export const MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${infuraProjectId}`;
export const MAINNET_DISPLAY_RPC_URL = `https://mainnet.infura.io/v3/`;
export const MAINNET_EXPLORER_URL = 'https://etherscan.io';

export const THETAMAINNET_RPC_URL = THETA_NETWORK.ethRpcUrl;
export const THETAMAINNET_NATIVE_RPC_URL = THETA_NETWORK.nativeRpcUrl;
export const THETAMAINNET_EXPLORER_URL = THETA_NETWORK.explorerUrl;
export const THETAMAINNET_EXPLORER_API_URL = THETA_NETWORK.explorerApiUrl;

export const ETH_SYMBOL = 'ETH';
export const THETA_SYMBOL = 'THETA';
export const TFUEL_SYMBOL = 'TFUEL';

export const ETH_TOKEN_IMAGE_URL = '/images/eth.svg';
export const THETA_TOKEN_IMAGE_URL = '/images/theta-coin.svg';
export const TFUEL_TOKEN_IMAGE_URL = '/images/tfuel-coin.svg';

export const INFURA_PROVIDER_TYPES = [ROPSTEN, RINKEBY, KOVAN, MAINNET, GOERLI];

export const NETWORK_TYPE_TO_ID_MAP = {
  [ROPSTEN]: { networkId: ROPSTEN_NETWORK_ID, chainId: ROPSTEN_CHAIN_ID },
  [RINKEBY]: { networkId: RINKEBY_NETWORK_ID, chainId: RINKEBY_CHAIN_ID },
  [KOVAN]: { networkId: KOVAN_NETWORK_ID, chainId: KOVAN_CHAIN_ID },
  [GOERLI]: { networkId: GOERLI_NETWORK_ID, chainId: GOERLI_CHAIN_ID },
  [MAINNET]: { networkId: MAINNET_NETWORK_ID, chainId: MAINNET_CHAIN_ID },
};

export const NETWORK_TO_NAME_MAP = {
  [ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY]: RINKEBY_DISPLAY_NAME,
  [KOVAN]: KOVAN_DISPLAY_NAME,
  [MAINNET]: MAINNET_DISPLAY_NAME,
  [GOERLI]: GOERLI_DISPLAY_NAME,

  [ROPSTEN_NETWORK_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_NETWORK_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_NETWORK_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_NETWORK_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_NETWORK_ID]: MAINNET_DISPLAY_NAME,

  [ROPSTEN_CHAIN_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_CHAIN_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_CHAIN_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_CHAIN_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_CHAIN_ID]: MAINNET_DISPLAY_NAME,
};

export const MAINNET_COLOR = '#454a75'; // ethereum gray-purple
export const MAINNET_COLOR_DARK = '#363a57'; // dimmed ethereum gray-purple
export const THETA_NATIVE_COLOR = '#29b6af'; // theta-blue
export const THETA_NATIVE_COLOR_DARK = '#289b95'; // dimmed theta-blue
export const THETA_SC_COLOR = '#ff850b'; // tfuel-orange
export const THETA_SC_COLOR_DARK = '#d57311'; // dimmed tfuel-orange
export const DEFAULT_NET_COLOR = '#000'; // black

export function networkColor(chainIdOrNetworkId, selectedNative) {
  switch (chainIdOrNetworkId) {
    case THETAMAINNET_CHAIN_ID:
    case THETAMAINNET_NETWORK_ID:
      return selectedNative ? THETA_NATIVE_COLOR : THETA_SC_COLOR;
    case MAINNET_CHAIN_ID:
    case MAINNET_NETWORK_ID:
      return MAINNET_COLOR;
    default:
      return DEFAULT_NET_COLOR;
  }
}

export function networkColorName(chainIdOrNetworkId, selectedNative) {
  switch (chainIdOrNetworkId) {
    case THETAMAINNET_CHAIN_ID:
    case THETAMAINNET_NETWORK_ID:
      if (selectedNative) {
        return THETAMAINNET;
      }
      return THETASC;
    case MAINNET_CHAIN_ID:
    case MAINNET_NETWORK_ID:
      return MAINNET;
    default:
      return 'black';
  }
}

const defaultEthState = {
  eip1559Compatible: true,
  basicGasEstimates: {
    baseFee: 25,
    safeLow: 1,
    average: 1,
    fast: 2,
  },
  gasLimit: '0x1c9c380',
};
export const GAS_PRICING_INIT = {
  [MAINNET_NETWORK_ID]: defaultEthState,
  [ROPSTEN_NETWORK_ID]: defaultEthState,
  [RINKEBY_NETWORK_ID]: defaultEthState,
  [KOVAN_NETWORK_ID]: defaultEthState,
  [GOERLI_NETWORK_ID]: defaultEthState,
  [THETAMAINNET_NETWORK_ID]: {
    eip1559Compatible: false,
    fixedPrice: true,
    basicGasEstimates: {
      safeLow: 4000,
      average: 4000,
      fast: 4000,
    },
    gasLimit: '0x1312d00',
  },
};

export const THETA_GASPRICE_GWEI_DEC = 4000;
export const THETA_GASPRICE_HEXWEI = '0x3a352944000'; // 4000 gwei in wei
export const THETA_GAS_PER_TRANSFER_HEXWEI = '0x124f8'; // 75,000 gas (@ 4000 gwei is 0.3 TFUEL); cost of native Theta and/or TFuel transfers
export const THETA_GAS_EST_PER_TDROP_STAKE_UNSTAKE = '0x2ee00'; // 192,000 gas => 0.768 TFUEL at above price (seen txs from 89k to 127.5k gas. For performance, using 128k * 1.5x buffer rather than fetching from network)
