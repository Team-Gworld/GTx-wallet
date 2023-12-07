import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerHeader from '../../../components/ui/page-container/page-container-header';

export default class StakeHeader extends Component {
  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string,
    isUnstaking: PropTypes.bool,
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
    const { isUnstaking } = this.props;
    const title = isUnstaking ? t('removeStake') : t('addStake');

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
