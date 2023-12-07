import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import Dialog from '../../../components/ui/dialog';
import { ipfsUrlReplace } from '../../../helpers/utils/ipfs.utils';
import SendAmountRow from './send-amount-row';
import SendGasRow from './send-gas-row';
import SendHexDataRow from './send-hex-data-row';
import SendAssetRow from './send-asset-row';

export default class SendContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateGas: PropTypes.func,
    showAddToAddressBookModal: PropTypes.func,
    showHexData: PropTypes.bool,
    contact: PropTypes.object,
    isOwnedAccount: PropTypes.bool,
    sendingNFT: PropTypes.object,
    inNativeMode: PropTypes.bool,
    ipfsGateway: PropTypes.string,
  };

  updateGas = (updateData) => this.props.updateGas(updateData);

  render() {
    const { sendingNFT, inNativeMode, ipfsGateway } = this.props;
    return (
      <PageContainerContent>
        <div className="send-v2__form">
          {this.maybeRenderAddContact()}
          {sendingNFT ? (
            <div className="nft-info">
              <img
                className="nft-image"
                src={ipfsUrlReplace(sendingNFT.image, ipfsGateway)}
              />
              <div className="token-id">#{sendingNFT.tokenID}</div>
              <div className="nft-name">{sendingNFT.name}</div>
              {sendingNFT.multiplier && (
                <div className="tbill-multiplier">
                  Multiplier: {sendingNFT.multiplier.toString()}X
                </div>
              )}
              {sendingNFT.maxTokensPerPool && (
                <div className="tbill-multiplier">
                  Max Tokens: {sendingNFT.maxTokensPerPool.toString()}
                </div>
              )}
            </div>
          ) : (
            <>
              <SendAssetRow />
              <SendAmountRow updateGas={(opts) => this.updateGas(opts)} />
            </>
          )}
          {!inNativeMode && <SendGasRow />}
          {this.props.showHexData && !sendingNFT && (
            <SendHexDataRow updateGas={(opts) => this.updateGas(opts)} />
          )}
        </div>
      </PageContainerContent>
    );
  }

  maybeRenderAddContact() {
    const { t } = this.context;
    const {
      isOwnedAccount,
      showAddToAddressBookModal,
      contact = {},
    } = this.props;

    if (isOwnedAccount || contact.name) {
      return null;
    }

    return (
      <Dialog
        type="message"
        className="send__dialog"
        onClick={showAddToAddressBookModal}
      >
        {t('newAccountDetectedDialogMessage')}
      </Dialog>
    );
  }
}
