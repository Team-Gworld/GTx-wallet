import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import Identicon from '../../../../ui/identicon';
import { getSelectedNFT, tokenAddressSelector } from '../../../../../selectors';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    actionLabel,
    title,
    titleComponent,
    subtitle,
    subtitleComponent,
    hideSubtitle,
    className,
    identiconAddress,
    nonce,
    assetImage,
  } = props;

  const tokenAddress = useSelector(tokenAddressSelector);
  const selectedNFT = useSelector(getSelectedNFT);
  const nft =
    selectedNFT && tokenAddress === selectedNFT.tokenAddress
      ? selectedNFT
      : null;

  const nonNFT = (
    <>
      <div className="confirm-page-container-summary__title">
        {identiconAddress && (
          <Identicon
            className="confirm-page-container-summary__identicon"
            diameter={36}
            address={identiconAddress}
            image={assetImage}
          />
        )}
        <div className="confirm-page-container-summary__title-text">
          {titleComponent || title}
        </div>
      </div>
      {!hideSubtitle && (
        <div className="confirm-page-container-summary__subtitle">
          {subtitleComponent || subtitle}
        </div>
      )}
    </>
  );

  return (
    <div className={classnames('confirm-page-container-summary', className)}>
      <div className="confirm-page-container-summary__action-row">
        <div className="confirm-page-container-summary__action">
          {actionLabel || action}
        </div>
        {nonce && (
          <div className="confirm-page-container-summary__nonce">
            {`#${nonce}`}
          </div>
        )}
      </div>
      {nft ? (
        <div className="nft-info">
          <img className="nft-image" src={nft.image} />
          <div className="nft-text">
            <div className="nft-name">{nft.name}</div>
            <div className="token-id">#{nft.tokenID}</div>
          </div>
        </div>
      ) : (
        <>{nonNFT}</>
      )}
    </div>
  );
};

ConfirmPageContainerSummary.propTypes = {
  action: PropTypes.string,
  actionLabel: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  titleComponent: PropTypes.node,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitleComponent: PropTypes.node,
  hideSubtitle: PropTypes.bool,
  className: PropTypes.string,
  identiconAddress: PropTypes.string,
  nonce: PropTypes.string,
  assetImage: PropTypes.string,
};

export default ConfirmPageContainerSummary;
