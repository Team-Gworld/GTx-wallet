import React from 'react';
import PropTypes from 'prop-types';
import StakeAssetBreadcrumb from './stake-asset-breadcrumb';

const StakeAssetNavigation = ({
  accountName,
  assetName,
  onBack,
  optionsButton,
}) => {
  return (
    <div className="asset-navigation">
      <StakeAssetBreadcrumb
        accountName={accountName}
        assetName={assetName}
        onBack={onBack}
      />
      {optionsButton}
    </div>
  );
};

StakeAssetNavigation.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  optionsButton: PropTypes.element,
};

StakeAssetNavigation.defaultProps = {
  optionsButton: undefined,
};

export default StakeAssetNavigation;
