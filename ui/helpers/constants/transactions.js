import { TRANSACTION_TYPE } from '../../../shared/constants/transaction';

export const UNAPPROVED_STATUS = 'unapproved';
export const REJECTED_STATUS = 'rejected';
export const APPROVED_STATUS = 'approved';
export const SIGNED_STATUS = 'signed';
export const SUBMITTED_STATUS = 'submitted';
export const CONFIRMED_STATUS = 'confirmed';
export const FAILED_STATUS = 'failed';
export const DROPPED_STATUS = 'dropped';
export const CANCELLED_STATUS = 'cancelled';

export const PENDING_STATUS_HASH = {
  [UNAPPROVED_STATUS]: true,
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
};

export const PRIORITY_STATUS_HASH = {
  ...PENDING_STATUS_HASH,
  [CONFIRMED_STATUS]: true,
};

export const TOKEN_CATEGORY_HASH = {
  [TRANSACTION_TYPE.TOKEN_METHOD_APPROVE]: true,
  [TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER]: true,
  [TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM]: true,
  [TRANSACTION_TYPE.TOKEN_METHOD_WRAP]: true,
  [TRANSACTION_TYPE.TOKEN_METHOD_UNWRAP]: true,
};

export const INCOMING_TRANSACTION = 'incoming';

export const SEND_ETHER_ACTION_KEY = 'sentEther';
export const DEPLOY_CONTRACT_ACTION_KEY = 'contractDeployment';
export const APPROVE_ACTION_KEY = 'approve';
export const SEND_TOKEN_ACTION_KEY = 'sentTokens';
export const TRANSFER_FROM_ACTION_KEY = 'transferFrom';
export const SIGNATURE_REQUEST_KEY = 'signatureRequest';
export const DECRYPT_REQUEST_KEY = 'decryptRequest';
export const ENCRYPTION_PUBLIC_KEY_REQUEST_KEY = 'encryptionPublicKeyRequest';
export const CONTRACT_INTERACTION_KEY = 'contractInteraction';
export const CANCEL_ATTEMPT_ACTION_KEY = 'cancelAttempt';
export const DEPOSIT_TRANSACTION_KEY = 'deposit';
export const STAKE_ACTION_KEY = 'stake';
export const UNSTAKE_ACTION_KEY = 'unstake';
export const WRAP_ACTION_KEY = 'wrap';
export const UNWRAP_ACTION_KEY = 'unwrap';

// Transaction List Item Categories
export const TRANSACTION_CATEGORY_SEND = 'send';
export const TRANSACTION_CATEGORY_RECEIVE = 'receive';
export const TRANSACTION_CATEGORY_INTERACTION = 'interaction';
export const TRANSACTION_CATEGORY_APPROVAL = 'approval';
export const TRANSACTION_CATEGORY_SIGNATURE_REQUEST = 'signature-request';
export const TRANSACTION_CATEGORY_STAKE = 'stake';
export const TRANSACTION_CATEGORY_UNSTAKE = 'unstake';
export const TRANSACTION_CATEGORY_WRAP = 'wrap';
export const TRANSACTION_CATEGORY_UNWRAP = 'unwrap';
