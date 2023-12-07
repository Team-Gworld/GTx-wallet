import React from 'react';
import PropTypes from 'prop-types';

export default function PlusIcon({
  width = '22',
  height = '22',
  fill = 'none',
  stroke = '#037dd6',
} = {}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={fill}>
        <rect
          fill={stroke}
          height={(4 * Math.min(width, height)) / 22}
          rx="2"
          width={width}
          y={(9 * Math.min(width, height)) / 22}
        />
        <rect
          fill={stroke}
          height={height}
          rx="2"
          width={(4 * Math.min(width, height)) / 22}
          x={(9 * Math.min(width, height)) / 22}
        />
      </g>
    </svg>
  );
}

PlusIcon.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  fill: PropTypes.string,
  stroke: PropTypes.string,
};
