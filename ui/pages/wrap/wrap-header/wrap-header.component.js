import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerHeader from '../../../components/ui/page-container/page-container-header';

export default class WrapHeader extends Component {
  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string,
    isUnwrapping: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onClose() {
    const { clearSend, history, mostRecentOverviewPage } = this.props;
    clearSend();
    history.push(mostRecentOverviewPage);
  }

  render() {
    const { t } = this.context;
    const { isUnwrapping } = this.props;
    const title = isUnwrapping ? t('unwrap') : t('wrap');

    return (
      <PageContainerHeader
        className="wrap__header"
        onClose={() => this.onClose()}
        title={title}
        headerCloseText={t('cancel')}
      />
    );
  }
}
