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
  getSendAssetType,
} from '../../../../selectors';
import { updateSendAsset } from '../../../../store/actions';
import WrapAssetRow from './wrap-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    sendAssetAddress: getSendAssetAddress(state),
    sendAssetType: getSendAssetType(state),
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
    setSendAsset: (type, token) =>
      dispatch(
        updateSendAsset({
          ...(token || { address: null }),
          type,
        }),
      ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(WrapAssetRow);
