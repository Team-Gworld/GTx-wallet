import { connect } from 'react-redux';
import {
  getSendAssetMode,
  getSendAssetType,
  getSendAssetStake,
  getSendAssetAddress,
} from '../../../../selectors';
import { updateSendAsset } from '../../../../store/actions';
import { ASSET_TYPE } from '../../../../../shared/constants/transaction';
import WrapTypeRow from './wrap-type-row.component';

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
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: (opts) => dispatch(updateSendAsset(opts)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(WrapTypeRow);
