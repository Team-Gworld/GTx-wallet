import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import WrapAmountRow from './wrap-amount-row';
import WrapHexDataRow from './wrap-hex-data-row';
import WrapAssetRow from './wrap-asset-row';

export default class WrapContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateGas: PropTypes.func,
    history: PropTypes.object,
    showHexData: PropTypes.bool,
  };

  updateGas = (updateData) => this.props.updateGas(updateData);

  render() {
    const { history, showHexData } = this.props;

    return (
      <PageContainerContent>
        <div className="wrap-v2__form">
          <WrapAssetRow history={history} />
          <WrapAmountRow updateGas={(opts) => this.updateGas(opts)} />
          {showHexData && (
            <WrapHexDataRow updateGas={(opts) => this.updateGas(opts)} />
          )}
        </div>
      </PageContainerContent>
    );
  }
}
