export function formatETHFee(ethFee, nativeCurrency = 'ETH') {
  return `${ethFee} ${nativeCurrency}`;
}

export function formatNumber(num) {
  if (typeof num === 'undefined' || num === null) {
    return '';
  }
  const str = num.toString().split('.');
  str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/gu, '$1 ');
  return str.join('.').replace(/[ ]+$/u, ''); // eslint-disable-line no-irregular-whitespace
}
