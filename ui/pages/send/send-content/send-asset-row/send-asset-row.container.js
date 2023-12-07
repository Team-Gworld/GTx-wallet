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
  getSendEditingTransactionId,
} from '../../../../selectors';
import { updateSendAsset } from '../../../../store/actions';
import { ASSET_MODE } from '../../../../../shared/constants/transaction';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    sendAssetAddress: getSendAssetAddress(state),
    sendAssetMode: getSendAssetMode(state),
    sendAssetType: getSendAssetType(state),
    accounts: getMetaMaskAccounts(state),
    network: state.metamask.network,
    nativeCurrency: getNativeCurrency(state),
    nativeCurrency2: getSelectedNative(state)
      ? getNativeCurrency2(state)
      : undefined,
    nativeCurrencyImage: getNativeCurrencyImage(state),
    nativeCurrency2Image: getNativeCurrency2Image(state),
    assetImages: getAssetImages(state) || {},
    isEditing: Boolean(getSendEditingTransactionId(state)),
  };
}

function mapDispatchToProps(dispatch) {
  const mode = ASSET_MODE.SEND;
  return {
    setSendAsset: (type, token) =>
      dispatch(
        updateSendAsset({
          ...(token || {
            address: null,
            decimals: null,
            staking: null,
            additional: null,
            isERC721: null,
          }),
          mode,
          type,
        }),
      ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
