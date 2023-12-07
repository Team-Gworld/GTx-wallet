export function ipfsUrlReplace(url, gateway = 'dweb.link') {
  return url.replace(
    'ipfs://',
    `https://${gateway
      .replace(/^https?:\/\//u, '')
      .replace(/\/$/u, '')
      .replace(/\/ipfs$/u, '')}/ipfs/`,
  );
}
