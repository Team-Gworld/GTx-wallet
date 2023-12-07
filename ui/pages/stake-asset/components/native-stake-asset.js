import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import * as thetajs from '@thetalabs/theta-js';
import TransactionList from '../../../components/app/transaction-list';
import { EthOverview } from '../../../components/app/wallet-overview';
import {
  getSelectedAccount,
  getSelectedIdentity,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { THETA_SYMBOL } from '../../../../app/scripts/controllers/network/enums';
import StakeOverview from '../../../components/app/wallet-overview/stake-overview';
import StakeAssetNavigation from './stake-asset-navigation';
import StakeAssetOptions from './stake-asset-options';
import Stakes from './stakes';

const { StakePurpose } = thetajs.constants;

export default function NativeStakeAsset({ nativeCurrency }) {
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const history = useHistory();

  const selectedAccount = useSelector(getSelectedAccount);
  const { balance, balance2 } = selectedAccount;
  const assetBalance = nativeCurrency === THETA_SYMBOL ? balance2 : balance;

  return (
    <>
      <StakeAssetNavigation
        accountName={selectedAccountName}
        assetName={nativeCurrency}
        onBack={() => history.push(DEFAULT_ROUTE)}
      />
      <StakeOverview
        className="asset__overview"
        assetName={nativeCurrency}
        assetBalance={assetBalance}
      />
      <Stakes assetName={nativeCurrency} />
      <TransactionList
        showHeader
        hideTokenTransactions
        showPurposes={
          nativeCurrency === THETA_SYMBOL
            ? [StakePurpose.StakeForGuardian, StakePurpose.StakeForValidator]
            : [StakePurpose.StakeForEliteEdge]
        }
      />
    </>
  );
}

NativeStakeAsset.propTypes = {
  nativeCurrency: PropTypes.string.isRequired,
};
