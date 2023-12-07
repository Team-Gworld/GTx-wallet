import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class AmountMaxButton extends Component {
  static propTypes = {
    balance: PropTypes.string,
    balance2: PropTypes.string,
    buttonDataLoading: PropTypes.bool,
    clearMaxAmount: PropTypes.func,
    inError: PropTypes.bool,
    gasTotal: PropTypes.string,
    maxModeOn: PropTypes.bool,
    sendAsset: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setMaxModeTo: PropTypes.func,
    tokenBalance: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  setMaxAmount() {
    const {
      balance,
      balance2,
      gasTotal,
      sendAsset,
      setAmountToMax,
      tokenBalance,
    } = this.props;

    setAmountToMax({
      balance,
      balance2,
      gasTotal,
      sendAsset,
      tokenBalance,
    });
  }

  onMaxClick = () => {
    const { setMaxModeTo, clearMaxAmount, maxModeOn } = this.props;

    if (maxModeOn) {
      setMaxModeTo(false);
      clearMaxAmount();
    } else {
      setMaxModeTo(true);
      this.setMaxAmount();
    }
  };

  render() {
    const { maxModeOn, buttonDataLoading } = this.props;

    return (
      <div
        className="wrap-v2__amount-max"
        onClick={buttonDataLoading ? null : this.onMaxClick}
      >
        <input type="checkbox" checked={maxModeOn} readOnly />
        <div
          className={classnames('wrap-v2__amount-max__button', {
            'wrap-v2__amount-max__button__disabled': buttonDataLoading,
          })}
        >
          {this.context.t('max')}
        </div>
      </div>
    );
  }
}
