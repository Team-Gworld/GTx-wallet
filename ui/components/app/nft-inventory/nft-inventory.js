import https from 'https';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import abiERC721 from 'human-standard-collectible-abi';
import log from 'loglevel';
import { NETWORK_TYPE_TO_ID_MAP } from '../../../../app/scripts/controllers/network/enums';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ipfsUrlReplace } from '../../../helpers/utils/ipfs.utils';
import { getIpfsGateway } from '../../../selectors';
import NFT from '../nft';

const nftPageCacheInterval = 60 * 1000;
const nftCacheInterval = 5 * 60 * 1000;
const cacheCleanInterval = 150 * 1000;
const pageSize = 1000; // TODO: should be property and vary with clicking a UI element

function useForceUpdate() {
  // TODO: replace forced update with normal react update behavior
  const [, /* value */ setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

const NFTInventory = ({ className, onClickNFT, token }) => {
  // currently supports only ERC721Enumerable, should not crash if encounter other type though and should later allow user to enter tokenID for non-enumerable transfers OR use event logs to discover
  // for now, check if enumerable before jumping to inventory screen ..

  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);
  const [chainId, selectedAddress] = useSelector((state) => [
    NETWORK_TYPE_TO_ID_MAP[state.metamask.provider.type]?.chainId ||
      state.metamask.provider.chainId,
    state.metamask.selectedAddress,
  ]);
  const tokenAddress = token.address;
  const contract =
    tokenAddress.substr(0, 38) === '0x000000000000000000000000000000000000'
      ? null
      : global.eth.contract(abiERC721).at(tokenAddress);

  async function getNfts(offset, pageSize_) {
    // TODO: should move to better location in source tree such as a token tracker in the background
    if (!contract) {
      return Promise.resolve([]);
    }
    const balResp = await contract.balanceOf(selectedAddress);
    const count = balResp?.[0].toNumber() || 0;
    log.debug('token count ', count);

    const proms = [];
    for (let i = offset; i < count && i < offset + pageSize_; ++i) {
      proms.push(getNftData(tokenAddress, i));
    }
    return Promise.all(proms);
  }

  async function getNftData(tokenAddress_, i) {
    const tokenResp = await contract.tokenOfOwnerByIndex(selectedAddress, i);
    if (!tokenResp) {
      log.error('failed to get token info for ', selectedAddress, i);
      return null;
    }
    const tokenID = tokenResp[0].toString(); // not caching tokenID because ownership can change (could for short period)
    log.debug('tokenID', tokenID);

    // TODO: replace NFT cache with more standard technique such as memoization via useCallback and useUnchanged
    const cachedNft =
      window.nftCache?.[chainId]?.[selectedAddress]?.[tokenAddress_]?.[tokenID];
    if (cachedNft && Date.now() - cachedNft.updated <= nftCacheInterval) {
      return cachedNft;
    }

    const tokenURIResp = await contract.tokenURI(tokenID); // tokenURI may be a link to JSON OR base64 encoded JSON
    if (!tokenURIResp) {
      log.error('failed to get tokenURI for ', selectedAddress, i);
      return { tokenID };
    }
    const tokenURI = tokenURIResp[0].toString();
    log.debug('tokenURI', tokenURI); // can be https, ipfs, or base64 encoded json should support all 3
    const metadata = await getMetadata(tokenURI);
    log.debug('metadata: ', metadata);
    if (!metadata) {
      log.error('failed to fetch metadata for tokenID ', tokenID);
      return { tokenID };
    }
    const name = metadata.name ?? '';
    const image = metadata.image_data
      ? `data:image/svg+xmlutf8,${metadata.image_data}`
      : ipfsUrlReplace(metadata.image, ipfsGateway);
    const nft = {
      updated: Date.now(),
      tokenAddress: tokenAddress_,
      tokenID,
      name,
      image,
      metadata:
        metadata.length > 65535
          ? {
              name,
              image,
              description: metadata.description,
              TRUNCATED: 'metadata length > 65535',
            }
          : metadata,
    };
    cacheNFT(tokenAddress_, tokenID, nft);
    return nft;
  }

  function cacheNFT(tokenAddress_, tokenID, nft) {
    if (!window.nftCache) {
      window.nftCache = {};
    }
    if (!window.nftCache[chainId]) {
      window.nftCache[chainId] = {};
    }
    if (!window.nftCache[chainId][selectedAddress]) {
      window.nftCache[chainId][selectedAddress] = {};
    }
    if (!window.nftCache[chainId][selectedAddress][tokenAddress_]) {
      window.nftCache[chainId][selectedAddress][tokenAddress_] = {};
    }
    window.nftCache[chainId][selectedAddress][tokenAddress_][tokenID] = nft;

    window.nftCache.cleaner =
      window.nftCache.cleaner ??
      setInterval(() => {
        Object.keys(window.nftCache).forEach((chainId_) => {
          if (chainId_ === 'cleaner') {
            return;
          }
          const chain = window.nftCache[chainId_];
          Object.keys(chain).forEach((cacheSelectedAddress_) => {
            const wallet = chain[cacheSelectedAddress_];
            Object.keys(wallet).forEach((cacheTokenAddress) => {
              const collection = wallet[cacheTokenAddress];
              Object.keys(collection).forEach((cacheTokenID) => {
                const cachedNft = collection[cacheTokenID];
                if (Date.now() - cachedNft.updated > nftCacheInterval) {
                  delete collection[cacheTokenID];
                }
              });
              if (!collection.length) {
                delete wallet[cacheTokenAddress];
              }
            });
            if (!wallet.length) {
              delete chain[cacheSelectedAddress_];
            }
          });
        });
      }, cacheCleanInterval);
  }

  async function getMetadata(tokenURI) {
    const url0to29 = tokenURI.substr(0, 29);
    if (url0to29 === 'data:application/json;base64,') {
      return decodeJSONDataLink(tokenURI);
    }
    const url0to8 = url0to29.substr(0, 8);
    if (url0to8 === 'https://') {
      return await fetchJSON(tokenURI);
    }
    const url0to7 = url0to8.substr(0, 7);
    if (url0to7 === 'ipfs://') {
      return await fetchJSON(ipfsUrlReplace(tokenURI, ipfsGateway));
    }
    log.warn('unsupported tokenURI: ', tokenURI);
    return null;
  }

  async function fetchJSON(url) {
    return new Promise((resolve) => {
      https
        .get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              return resolve(JSON.parse(body));
            } catch (error) {
              log.error(error.message);
              return resolve(null);
            }
          });
        })
        .on('error', (error) => {
          log.error(error.message);
          return resolve(null);
        });
    });
  }

  function decodeJSONDataLink(link) {
    const data = link.substr(29);
    try {
      const json = Buffer.from(data, 'base64');
      return JSON.parse(json);
    } catch (err) {
      log.error(err);
      return null;
    }
  }

  // TODO: improve caching for pages OR cache tokenIDs too but just for a short period of time in case they change OR watch events and assume they didn't change if no such events came in
  const forceUpdate = useForceUpdate();
  const offset = 0; // TODO: this should vary when paging is added
  let nfts = null;
  let refreshPageCache = false;
  if (!window.nftPageCache) {
    window.nftPageCache = { updated: 0 };
  }
  const pc = window.nftPageCache;
  if (
    pc.chainId === chainId &&
    pc.selectedAddress === selectedAddress &&
    pc.tokenAddress === tokenAddress &&
    pc.offset === offset &&
    pc.pageSize === pageSize
  ) {
    // pageCache matches current selection
    nfts = pc.nfts;
    if (Date.now() - pc.updated > nftPageCacheInterval) {
      refreshPageCache = true;
    }
  } else {
    refreshPageCache = true;
  }
  if (refreshPageCache) {
    getNfts(0, pageSize)
      .then((nfts_) => {
        // sort
        if (
          nfts_.length &&
          nfts_[0].metadata &&
          nfts_[0].metadata?.['attributes'].filter(
            (e) => e.trait_type === 'multiplier',
          )?.[0]?.value &&
          nfts_[0].metadata?.['attributes'].filter(
            (e) => e.trait_type === 'maxTokensPerPool',
          )?.[0]?.value
        ) {
          nfts_.sort((a, b) => {
            const aMult = a.metadata?.['attributes'].filter(
              (e) => e.trait_type === 'multiplier',
            )?.[0]?.value;
            const bMult = b.metadata?.['attributes'].filter(
              (e) => e.trait_type === 'multiplier',
            )?.[0]?.value;
            if (aMult === bMult) {
              const aMtpp = a.metadata?.['attributes'].filter(
                (e) => e.trait_type === 'maxTokensPerPool',
              )?.[0]?.value;
              const bMtpp = b.metadata?.['attributes'].filter(
                (e) => e.trait_type === 'maxTokensPerPool',
              )?.[0]?.value;
              return parseFloat(bMtpp) - parseFloat(aMtpp);
            }
            return parseFloat(bMult) - parseFloat(aMult);
          });
        }

        // nfts = nfts_.slice(0,3) //TODO: should paginate
        nfts = nfts_;
        window.nftPageCache = {
          // TODO: move to mm state
          updated: Date.now(),
          chainId,
          selectedAddress,
          tokenAddress,
          offset,
          pageSize,
          nfts,
        };
        forceUpdate();
      })
      .catch((err) => log.error(err));
  }

  const NFTs = nfts ? (
    nfts.map((nft, index) => {
      return (
        <div
          key={index}
          className={`nft-item${window.nftSelected === nft ? ' selected' : ''}`}
          onClick={() => {
            window.nftSelected = nft;
            onClickNFT(nft);
          }}
        >
          <NFT nft={nft} />
        </div>
      );
    })
  ) : (
    <div>{t('loading')}</div>
  );

  return (
    <>
      <div className={className}>{NFTs}</div>
    </>
  );
};

NFTInventory.propTypes = {
  className: PropTypes.string,
  onClickNFT: PropTypes.func.isRequired,
  token: PropTypes.object.isRequired,
};

export default NFTInventory;
