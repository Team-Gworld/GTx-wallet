import { connect } from 'react-redux';
import { TRANSACTION_TYPE } from '../../../../shared/constants/transaction';
import {
  getIsMainnet,
  getNativeCurrency,
  getPreferences,
} from '../../../selectors';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';
import { sumHexes } from '../../../helpers/utils/transactions.util';
import TransactionBreakdown from './transaction-breakdown.component';

const mapStateToProps = (state, ownProps) => {
  const { transaction } = ownProps;
  const {
    txParams: { gas, gasPrice, maxFeePerGas, value, to, additional } = {},
    txReceipt: { gasUsed, effectiveGasPrice } = {},
    type,
  } = transaction;
  const { showFiatInTestnets } = getPreferences(state);
  const isMainnet = getIsMainnet(state);

  const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas;

  const hexGasTotal =
    (gasLimit &&
      (gasPrice || maxFeePerGas) &&
      getHexGasTotal({
        gasLimit,
        gasPrice: effectiveGasPrice ?? gasPrice ?? maxFeePerGas,
      })) ||
    '0x0';
  const totalInHex = sumHexes(hexGasTotal, value);

  let isERC721;
  if (type === TRANSACTION_TYPE.TOKEN_METHOD_TRANSFER_FROM) {
    const { tokens } = state.metamask;
    const token = tokens.find(({ address }) => address === to);
    isERC721 = token.isERC721;
  }

  const isUnstakeCurrency =
    type === TRANSACTION_TYPE.UNSTAKE && Boolean(additional);

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: isMainnet || Boolean(showFiatInTestnets),
    totalInHex,
    gas,
    gasPrice: effectiveGasPrice ?? gasPrice ?? maxFeePerGas,
    gasUsed,
    isERC721,
    isUnstakeCurrency,
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
