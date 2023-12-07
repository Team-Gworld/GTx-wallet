import React from 'react';
import PropTypes from 'prop-types';

import WrappableAssetBreadcrumb from './wrappable-asset-breadcrumb';

const WrappableAssetNavigation = ({
  accountName,
  assetName,
  unwrapping,
  onBack,
  optionsButton,
}) => {
  return (
    <div className="asset-navigation">
      <WrappableAssetBreadcrumb
        accountName={accountName}
        assetName={assetName}
        unwrapping={unwrapping}
        onBack={onBack}
      />
      {optionsButton}
    </div>
  );
};

WrappableAssetNavigation.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  unwrapping: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
  optionsButton: PropTypes.element,
};

WrappableAssetNavigation.defaultProps = {
  optionsButton: undefined,
};

export default WrappableAssetNavigation;
