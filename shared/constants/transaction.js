import { MESSAGE_TYPE } from '../../app/scripts/lib/enums';

export const TRANSACTION_TYPE = {
  CANCEL: 'cancel',
  RETRY: 'retry',
  TOKEN_METHOD_APPROVE: 'approve',
  TOKEN_METHOD_TRANSFER: 'transfer',
  TOKEN_METHOD_TRANSFER_FROM: 'transferfrom',
  TOKEN_METHOD_WRAP: 'wrap',
  TOKEN_METHOD_UNWRAP: 'unwrap',
  INCOMING: 'incoming',
  SENT_ETHER: 'sentEther',
  CONTRACT_INTERACTION: 'contractInteraction',
  DEPLOY_CONTRACT: 'contractDeployment',
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  SIGN: MESSAGE_TYPE.ETH_SIGN,
  SIGN_TYPED_DATA: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  PERSONAL_SIGN: MESSAGE_TYPE.PERSONAL_SIGN,
  ETH_DECRYPT: MESSAGE_TYPE.ETH_DECRYPT,
  ETH_GET_ENCRYPTION_PUBLIC_KEY: MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY,
};

export const TRANSACTION_STATUS = {
  APPROVED: 'approved',
  CONFIRMED: 'confirmed',
};

/**
 * The types of assets that a user can send
 * 1. NATIVE - The native asset for the current network, such as ETH or TFUEL
 * 2. NATIVE2 - The second native asset for the current network, such as THETA
 * 3. TOKEN - An ERC20 token.
 * 4. NFT - An ERC721 token.
 */
export const ASSET_TYPE = {
  NATIVE: 'NATIVE',
  NATIVE2: 'NATIVE2',
  TOKEN: 'TOKEN',
  NFT: 'NFT',
};

export const ASSET_MODE = {
  SEND: 'SEND',
  WRAP: 'WRAP',
  UNWRAP: 'UNWRAP',
  STAKE: 'STAKE',
  UNSTAKE: 'UNSTAKE',
  APPROVE: 'APPROVE',
};

export const STAKE_MODES = {
  NORMAL: 'NORMAL',
  SHARES: 'SHARES',
};
