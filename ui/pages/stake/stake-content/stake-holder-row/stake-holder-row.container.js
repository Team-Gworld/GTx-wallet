import { connect } from 'react-redux';
import {
  getSendAssetAddress,
  getSendAssetType,
  getSendAssetStake,
  getSendAssetMode,
  sendHolderIsInError,
} from '../../../../selectors';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import { updateSendAsset, updateSendTo } from '../../../../store/actions';
import { updateSendErrors } from '../../../../ducks/send/send.duck';
import StakeHolderRow from './stake-holder-row.component';

function mapStateToProps(state) {
  const sendAssetType = getSendAssetType(state);
  const sendAssetAddress = getSendAssetAddress(state);
  const sendAssetMode = getSendAssetMode(state);
  let token;
  if (sendAssetType === ASSET_TYPE.TOKEN) {
    token = state.metamask.tokens.find(({ address }) => {
      return address === sendAssetAddress;
    });
  }
  return {
    token,
    sendAssetType,
    sendAssetMode,
    sendAssetStake: getSendAssetStake(state),
    inError: sendHolderIsInError(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: (opts) => dispatch(updateSendAsset(opts)),
    updateSendTo: (address, nickname) =>
      dispatch(updateSendTo(address, nickname)),
    updateSendErrors: (opts) => dispatch(updateSendErrors(opts)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StakeHolderRow);
