import React, { Component } from 'react';
import PropTypes from 'prop-types';
import abi from 'human-standard-token-abi';
import log from 'loglevel';
import { THETA_GASPRICE_HEXWEI } from '../../../../app/scripts/controllers/network/enums';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import {
  ASSET_MODE,
  ASSET_TYPE,
} from '../../../../shared/constants/transaction';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { bnToHex } from '../../../helpers/utils/conversions.util';
import { isTokenBalanceSufficient } from '../../send/send.utils';
import StakeAmountRow from './stake-amount-row';
import StakeHexDataRow from './stake-hex-data-row';
import StakeAssetRow from './stake-asset-row';
import StakeTypeRow from './stake-type-row';
import StakeHolderRow from './stake-holder-row';

export default class StakeContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateGas: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    sendAsset: PropTypes.object,
    sendAmount: PropTypes.string,
    showHexData: PropTypes.bool,
    updateSendAsset: PropTypes.func,
    updateSendAmount: PropTypes.func,
    updateSendTo: PropTypes.func,
    sign: PropTypes.func,
    from: PropTypes.object,
  };

  updateStakingAllowance = () => {
    const {
      sendAsset,
      updateSendAsset,
      from: { address: accountAddress } = {},
    } = this.props;

    if (
      sendAsset.mode !== ASSET_MODE.STAKE ||
      sendAsset.type !== ASSET_TYPE.TOKEN ||
      !sendAsset.staking?.stakingAddress ||
      !sendAsset.address ||
      !accountAddress
    ) {
      if (sendAsset.stakingAllowance) {
        delete sendAsset.stakingAllowance;
        updateSendAsset(sendAsset);
      }
      return;
    }

    const contract = global.eth.contract(abi).at(sendAsset.address);
    contract
      .allowance(accountAddress, sendAsset.staking?.stakingAddress)
      .then((allowance) => {
        updateSendAsset({
          ...sendAsset,
          stakingAllowance: bnToHex(allowance.remaining),
        });
      })
      .catch((error) => {
        log.error(`error fetching token allowance: ${error.toString()}`);
      });
  };

  componentDidMount() {
    this.updateStakingAllowance();
  }

  componentDidUpdate(prevProps) {
    const { sendAsset, from: { address: accountAddress } = {} } = this.props;
    if (
      sendAsset.address !== prevProps.sendAsset.address ||
      sendAsset.mode !== prevProps.sendAsset.mode ||
      sendAsset.type !== prevProps.sendAsset.type ||
      accountAddress !== prevProps.from?.address
    ) {
      this.updateStakingAllowance();
    }
  }

  updateGas = (updateData) => this.props.updateGas(updateData);

  approve = async (event) => {
    event.preventDefault();

    const {
      history,
      sendAsset,
      updateSendAsset,
      updateSendAmount,
      updateSendTo,
      sign,
      from: { address: from },
    } = this.props;
    const unlimitedAmount =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    const approveAsset = {
      address: null,
      ...sendAsset,
      type: ASSET_TYPE.TOKEN,
      mode: ASSET_MODE.APPROVE,
    };
    await Promise.all([
      updateSendTo(sendAsset?.address, sendAsset?.name || sendAsset?.symbol),
      updateSendAsset(approveAsset),
    ]);
    await updateSendAmount(unlimitedAmount);
    await sign({
      from,
      sendAsset: approveAsset,
      amount: unlimitedAmount,
      gasPrice: THETA_GASPRICE_HEXWEI,
    });
    history.push(CONFIRM_TRANSACTION_ROUTE);
  };

  render() {
    const { history, sendAsset, sendAmount, showHexData } = this.props;
    const { t } = this.context;

    const allowanceInsufficient =
      sendAsset.mode === ASSET_MODE.STAKE &&
      sendAsset.type === ASSET_TYPE.TOKEN &&
      !isTokenBalanceSufficient({
        tokenBalance: sendAsset.stakingAllowance ?? '0x0',
        amount: sendAmount,
        decimals: sendAsset.decimals,
      });

    return (
      <PageContainerContent>
        <div className="wrap-v2__form">
          <StakeAssetRow history={history} />
          <StakeTypeRow />
          <StakeHolderRow />
          <StakeAmountRow updateGas={(opts) => this.updateGas(opts)} />
          {showHexData && (
            <StakeHexDataRow updateGas={(opts) => this.updateGas(opts)} />
          )}
          {allowanceInsufficient && (
            <div className="wrap-v2__form-row">
              <button className="button btn-secondary" onClick={this.approve}>
                {t('approveButtonText')}
              </button>
            </div>
          )}
        </div>
      </PageContainerContent>
    );
  }
}
