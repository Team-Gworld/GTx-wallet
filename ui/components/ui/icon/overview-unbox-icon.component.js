import React from 'react';
import PropTypes from 'prop-types';

export default function UnboxIcon({
  width = '22',
  height = '22',
  fill = 'none',
  stroke = '#037dd6',
} = {}) {
  const styleBox = {
    fill: 'none',
    stroke,
    strokeWidth: 3,
    strokeLinecap: 'butt',
    strokeLinejoin: 'round',
    strokeOpacity: 1,
  };
  const styleArrow = {
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeMiterlimit: 4,
    strokeDasharray: 'none',
    strokeOpacity: 1,
  };
  const styleFlaps = {
    fill: 'none',
    stroke,
    strokeWidth: 2.25,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeOpacity: 0.9,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="-10 -10 25 25"
      version="1.1"
      fill={fill}
    >
      <g transform="translate(-56,-145)">
        <path
          id="box"
          style={styleBox}
          d="m 66.145832,143.54167 v 15.875 H 50.270833 v -15.875"
        />
        <path
          id="left-arrow-head"
          style={styleArrow}
          d="M 58.208333,138.5042 55.5625,141.15004 Z"
        />
        <path
          id="right-arrow-head"
          style={styleArrow}
          d="m 58.208333,138.5042 2.645834,2.64584 z"
        />
        <path
          id="arrow-shaft"
          style={styleArrow}
          d="m 58.208333,138.5042 v 13.22917 z"
        />
        <path
          id="left-flap"
          style={styleFlaps}
          d="M 50.270833,143.54167 44.979167,138.25 Z"
        />
        <path
          id="right-flap"
          style={styleFlaps}
          d="M 66.145832,143.54167 71.4375,138.25 Z"
        />
      </g>
    </svg>
  );
}

UnboxIcon.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  fill: PropTypes.string,
  stroke: PropTypes.string,
};
