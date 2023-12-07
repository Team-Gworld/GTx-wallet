import {
  ETH_SYMBOL,
  MAINNET_DISPLAY_RPC_URL,
  MAINNET_EXPLORER_URL,
  MAINNET_NETWORK_ID,
  MAINNET_RPC_URL,
  TFUEL_SYMBOL,
  THETAMAINNET_EXPLORER_URL,
  THETAMAINNET_NETWORK_ID,
  THETAMAINNET_RPC_URL,
  THETA_NATIVE_COLOR,
} from '../../../../app/scripts/controllers/network/enums';

const defaultNetworksData = [
  {
    labelKey: 'theta_mainnet',
    iconColor: THETA_NATIVE_COLOR,
    providerType: 'rpc',
    rpcUrl: THETAMAINNET_RPC_URL,
    chainId: THETAMAINNET_NETWORK_ID,
    ticker: TFUEL_SYMBOL,
    blockExplorerUrl: THETAMAINNET_EXPLORER_URL,
  },
  {
    labelKey: 'mainnet',
    iconColor: '#454a75',
    providerType: 'mainnet',
    rpcUrl: MAINNET_RPC_URL,
    displayRpcUrl: MAINNET_DISPLAY_RPC_URL,
    chainId: MAINNET_NETWORK_ID,
    ticker: ETH_SYMBOL,
    blockExplorerUrl: MAINNET_EXPLORER_URL,
  },

  /*
  {
    labelKey: 'ropsten',
    iconColor: '#FF4A8D',
    providerType: 'ropsten',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/ropsten',
    chainId: '3',
    ticker: 'ETH',
    blockExplorerUrl: 'https://ropsten.etherscan.io',
  },
  {
    labelKey: 'rinkeby',
    iconColor: '#F6C343',
    providerType: 'rinkeby',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/rinkeby',
    chainId: '4',
    ticker: 'ETH',
    blockExplorerUrl: 'https://rinkeby.etherscan.io',
  },
  {
    labelKey: 'goerli',
    iconColor: '#3099f2',
    providerType: 'goerli',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/goerli',
    chainId: '5',
    ticker: 'ETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    labelKey: 'kovan',
    iconColor: '#9064FF',
    providerType: 'kovan',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/kovan',
    chainId: '42',
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    labelKey: 'localhost',
    iconColor: 'white',
    border: '1px solid #6A737D',
    providerType: 'localhost',
    rpcUrl: 'http://localhost:8545/',
    blockExplorerUrl: 'https://etherscan.io',
  },
  */
];

export { defaultNetworksData };
