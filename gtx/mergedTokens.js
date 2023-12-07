import contractsMap from '@metamask/contract-metadata';
import thetaTokens from './theta-tokens.json';
import gtxTokens from './gtx-tokens.json';

Object.keys(contractsMap).forEach((address) => {
  contractsMap[address].chainId = '0x1';
  contractsMap[address].address = address;
});
export const mergedTokens = { ...contractsMap, ...thetaTokens, ...gtxTokens };

export const lcDefaultTokens = {};
Object.keys({ ...thetaTokens, ...gtxTokens }).forEach((k) => {
  lcDefaultTokens[k.toLowerCase()] = mergedTokens[k];
});

export default mergedTokens;
