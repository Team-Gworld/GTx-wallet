import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

const StakeAssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  const t = useI18nContext();

  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <i
        className="fas fa-chevron-left asset-breadcrumb__chevron"
        data-testid="asset__back"
      />
      <span>{accountName}</span>
      &nbsp;/&nbsp;
      <span className="asset-breadcrumb__asset">
        {t('specifiedTokenStaking', [assetName])}
      </span>
    </button>
  );
};

StakeAssetBreadcrumb.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default StakeAssetBreadcrumb;
