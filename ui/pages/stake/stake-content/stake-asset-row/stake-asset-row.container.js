import { connect } from 'react-redux';
import {
  getAssetImages,
  getMetaMaskAccounts,
  getNativeCurrency,
  getNativeCurrencyImage,
  getNativeCurrency2,
  getNativeCurrency2Image,
  getSendAssetAddress,
  getSelectedNative,
  getSendAssetMode,
  getSendAssetType,
  getSendAssetStake,
} from '../../../../selectors';
import { updateSendAsset } from '../../../../store/actions';
import StakeAssetRow from './stake-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    sendAssetAddress: getSendAssetAddress(state),
    sendAssetType: getSendAssetType(state),
    sendAssetMode: getSendAssetMode(state),
    sendAssetStake: getSendAssetStake(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrency2: getSelectedNative(state)
      ? getNativeCurrency2(state)
      : undefined,
    nativeCurrencyImage: getNativeCurrencyImage(state),
    nativeCurrency2Image: getNativeCurrency2Image(state),
    assetImages: getAssetImages(state) || {},
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setSendAsset: (type, token, mode, stake) =>
      dispatch(
        updateSendAsset({
          ...(token || { address: null }),
          mode,
          type,
          stake,
        }),
      ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StakeAssetRow);
