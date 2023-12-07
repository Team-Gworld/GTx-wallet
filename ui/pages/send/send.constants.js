import ethUtil from 'ethereumjs-util';
import {
  conversionUtil,
  multiplyCurrencies,
} from '../../helpers/utils/conversion-util';

const MIN_GAS_PRICE_DEC = '0';
const MIN_GAS_PRICE_HEX = parseInt(MIN_GAS_PRICE_DEC, 10).toString(16);
const MIN_GAS_LIMIT_DEC = '21000';
const MIN_GAS_LIMIT_HEX = parseInt(MIN_GAS_LIMIT_DEC, 10).toString(16);

const MIN_GAS_PRICE_GWEI = ethUtil.addHexPrefix(
  conversionUtil(MIN_GAS_PRICE_HEX, {
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    numberOfDecimals: 1,
  }),
);

const MIN_GAS_TOTAL = multiplyCurrencies(MIN_GAS_LIMIT_HEX, MIN_GAS_PRICE_HEX, {
  toNumericBase: 'hex',
  multiplicandBase: 16,
  multiplierBase: 16,
});

const TOKEN_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb'; // transfer(address to, uint256 amount)
const NFT_SAFE_TRANSFER_FUNCTION_SIGNATURE = '42842e0e'; // safeTransferFrom(address from, address to, uint256 tokenId)
const NFT_TRANSFER_FUNCTION_SIGNATURE = '23b872dd'; // transferFrom(address from, address to, uint256 tokenId)
const APPROVE_FUNCTION_SIGNATURE = '0x095ea7b3'; // approve(address spender, uint256 amount)

const INSUFFICIENT_FUNDS_ERROR = 'insufficientFunds';
const INSUFFICIENT_TOKENS_ERROR = 'insufficientTokens';
const INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR = 'insufficientBalForWrapUnwrap';
const INSUFFICIENT_FUNDS_FOR_TF_WRAP_ERROR = 'insufficientBalForTfWrap';
const INSUFFICIENT_ALLOWANCE_FOR_STAKE_ERROR = 'insufficientAllowanceForStake';
const AMOUNT_LESS_THAN_MINIMUM_STAKE = 'amountLtMinStake';
const AMOUNT_MORE_THAN_MAXIMUM_STAKE = 'amountGtMaxStake';
const NEGATIVE_ETH_ERROR = 'negativeETH';
const INVALID_RECIPIENT_ADDRESS_ERROR = 'invalidAddressRecipient';
const INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR =
  'invalidAddressRecipientNotEthNetwork';
const REQUIRED_ERROR = 'required';
const KNOWN_RECIPIENT_ADDRESS_ERROR = 'knownAddressRecipient';

const SIMPLE_GAS_COST = '0x5208'; // Hex for 21000, cost of a simple send.
const BASE_TOKEN_GAS_COST = '0x186a0'; // Hex for 100000, a base estimate for token transfers.

export {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INSUFFICIENT_FUNDS_FOR_WRAP_UNWRAP_ERROR,
  INSUFFICIENT_FUNDS_FOR_TF_WRAP_ERROR,
  INSUFFICIENT_ALLOWANCE_FOR_STAKE_ERROR,
  AMOUNT_LESS_THAN_MINIMUM_STAKE,
  AMOUNT_MORE_THAN_MAXIMUM_STAKE,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_LIMIT_HEX,
  MIN_GAS_PRICE_DEC,
  MIN_GAS_PRICE_GWEI,
  MIN_GAS_PRICE_HEX,
  MIN_GAS_TOTAL,
  NEGATIVE_ETH_ERROR,
  REQUIRED_ERROR,
  SIMPLE_GAS_COST,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FUNCTION_SIGNATURE,
  NFT_SAFE_TRANSFER_FUNCTION_SIGNATURE,
  APPROVE_FUNCTION_SIGNATURE,
  BASE_TOKEN_GAS_COST,
};
