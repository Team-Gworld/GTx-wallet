// wrapper to make @ethereumjs/tx transactions compatible with the keyring controller in use

import {
  Transaction as Transaction_,
  FeeMarketEIP1559Transaction as FeeMarketEIP1559Transaction_,
} from '@ethereumjs/tx';

Transaction_.prototype.originalSign = Transaction_.prototype.sign;
FeeMarketEIP1559Transaction_.prototype.originalSign =
  FeeMarketEIP1559Transaction_.prototype.sign;
Transaction_.prototype.etc = {};
FeeMarketEIP1559Transaction_.prototype.etc = {};
const signWithOverwrite = function (key) {
  /* eslint-disable */
  const signedTx = this.originalSign(key);
  this.etc.signedTx = signedTx;
  return signedTx;
};
Transaction_.prototype.sign = signWithOverwrite;
FeeMarketEIP1559Transaction_.prototype.sign = signWithOverwrite;

export { Transaction_ as Transaction };
export { FeeMarketEIP1559Transaction_ as FeeMarketEIP1559Transaction };
