import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';
import { isTokenIrremovable } from '../../../helpers/utils/util';

const StakeAssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onClickThetaScan,
  tokenSymbol,
  tokenAddress,
  isNativeAsset,
  isThetaNetwork,
  isEthNetwork,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsButtonElement, setAssetOptionsButtonElement] =
    useState(null);
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);

  const thetaScan = isThetaNetwork && onClickThetaScan && (
    <MenuItem
      iconClassName="fas fa-external-link-alt asset-options__icon"
      data-testid="asset-options__etherscan"
      onClick={() => {
        setAssetOptionsOpen(false);
        onClickThetaScan();
      }}
    >
      {t('viewOnThetaScan')}
    </MenuItem>
  );
  const irremovable = isTokenIrremovable(tokenAddress, isNativeAsset);

  return (
    <>
      <button
        className="fas fa-ellipsis-v token-options__button"
        data-testid="token-options__button"
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
            iconClassName="fas fa-external-link-alt token-options__icon"
            data-testid="token-options__etherscan"
            onClick={() => {
              setAssetOptionsOpen(false);
              onClickBlockExplorer();
            }}
          >
            {isEthNetwork ? t('viewOnEtherscan') : t('viewInExplorer')}
          </MenuItem>
          {thetaScan}
          {!irremovable && (
            <MenuItem
              iconClassName="fas fa-trash-alt token-options__icon"
              data-testid="token-options__hide"
              onClick={() => {
                setAssetOptionsOpen(false);
                onRemove();
              }}
            >
              {t('hideTokenSymbol', [tokenSymbol])}
            </MenuItem>
          )}
        </Menu>
      ) : null}
    </>
  );
};

StakeAssetOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onClickBlockExplorer: PropTypes.func.isRequired,
  onClickThetaScan: PropTypes.func,
  tokenSymbol: PropTypes.string.isRequired,
  tokenAddress: PropTypes.string,
  isNativeAsset: PropTypes.bool,
  isThetaNetwork: PropTypes.bool,
  isEthNetwork: PropTypes.bool,
};

export default StakeAssetOptions;
