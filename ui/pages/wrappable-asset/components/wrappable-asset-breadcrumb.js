import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

const WrappableAssetBreadcrumb = ({
  accountName,
  assetName,
  unwrapping,
  onBack,
}) => {
  const t = useI18nContext();

  return (
    <button className="wrappable-asset-breadcrumb" onClick={onBack}>
      <i
        className="fas fa-chevron-left wrappable-asset-breadcrumb__chevron"
        data-testid="wrappable-asset__back"
      />
      <span>{accountName}</span>
      &nbsp;/&nbsp;
      <span className="wrappable-asset-breadcrumb__asset">
        {t(unwrapping ? 'unwrapSpecifiedTokens' : 'wrapSpecifiedTokens', [
          assetName,
        ])}
      </span>
    </button>
  );
};

WrappableAssetBreadcrumb.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  unwrapping: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default WrappableAssetBreadcrumb;
