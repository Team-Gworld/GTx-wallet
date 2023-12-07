import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { formatNumber } from '../../../helpers/utils/formatters';

export default class HexToDecimal extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    value: PropTypes.string,
  };

  render() {
    const { className, value } = this.props;
    const decimalValue = formatNumber(hexToDecimal(value));

    return <div className={className}>{decimalValue}</div>;
  }
}
