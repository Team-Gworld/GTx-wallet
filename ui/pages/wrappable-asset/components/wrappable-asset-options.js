import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';

const WrappableAssetOptions = ({
  onClickBlockExplorer,
  isEthNetwork,
  isThetaNetwork,
  onClickThetaScan,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsButtonElement, setAssetOptionsButtonElement] =
    useState(null);
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);

  const thetaScan = isThetaNetwork && onClickThetaScan && (
    <MenuItem
      iconClassName="fas fa-external-link-alt wrappable-asset-options__icon"
      data-testid="wrappable-asset-options__etherscan"
      onClick={() => {
        setAssetOptionsOpen(false);
        onClickThetaScan();
      }}
    >
      {t('viewOnThetaScan')}
    </MenuItem>
  );

  return (
    <>
      <button
        className="fas fa-ellipsis-v wrappable-asset-options__button"
        data-testid="wrappable-asset-options__button"
        onClick={() => setAssetOptionsOpen(true)}
        ref={setAssetOptionsButtonElement}
        title={t('assetOptions')}
      />
      {assetOptionsOpen ? (
        <Menu
          anchorElement={assetOptionsButtonElement}
          onHide={() => setAssetOptionsOpen(false)}
        >
          <MenuItem
            iconClassName="fas fa-external-link-alt wrappable-asset-options__icon"
            data-testid="wrappable-asset-options__etherscan"
            onClick={() => {
              setAssetOptionsOpen(false);
              onClickBlockExplorer();
            }}
          >
            {isEthNetwork ? t('viewOnEtherscan') : t('viewInExplorer')}
          </MenuItem>
          {thetaScan}
        </Menu>
      ) : null}
    </>
  );
};

WrappableAssetOptions.propTypes = {
  onClickBlockExplorer: PropTypes.func.isRequired,
  onClickThetaScan: PropTypes.func,
  isEthNetwork: PropTypes.bool,
  isThetaNetwork: PropTypes.bool,
};

export default WrappableAssetOptions;
