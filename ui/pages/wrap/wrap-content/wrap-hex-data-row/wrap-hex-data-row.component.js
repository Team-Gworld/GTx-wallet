import React, { Component } from 'react';
import PropTypes from 'prop-types';
import WrapRowWrapper from '../wrap-row-wrapper';

export default class StakeHexDataRow extends Component {
  static propTypes = {
    inError: PropTypes.bool,
    updateSendHexData: PropTypes.func.isRequired,
    updateGas: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onInput = (event) => {
    const { updateSendHexData, updateGas } = this.props;
    const data = event.target.value.replace(/\n/gu, '') || null;
    updateSendHexData(data);
    updateGas({ data });
  };

  render() {
    const { inError } = this.props;
    const { t } = this.context;

    return (
      <WrapRowWrapper
        label={`${t('hexData')}:`}
        showError={inError}
        errorType="amount"
      >
        <textarea
          onInput={this.onInput}
          placeholder="Optional"
          className="wrap-v2__hex-data__input"
        />
      </WrapRowWrapper>
    );
  }
}
