import { useState, useLayoutEffect } from 'react';
import { isEqual } from 'lodash';

/**
 * If theValue is unchanged, return the object or array stored to prevent rerenders.
 * @param {T} theValue  - an object or array to check if unchanged
 * @returns {T}
 */
export function useUnchanged(theValue) {
  const [val, setVal] = useState(theValue);

  useLayoutEffect(() => {
    if (!isEqual(theValue, val)) {
      setVal(theValue);
    }
  }, [theValue, val]);

  return val;
}
