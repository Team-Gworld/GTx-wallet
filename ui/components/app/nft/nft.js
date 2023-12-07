import React from 'react';
import PropTypes from 'prop-types';

const NFT = ({ nft }) => {
  const multiplier = nft.metadata?.['attributes'].filter(
    (e) => e.trait_type === 'multiplier',
  )?.[0]?.value;
  const maxTokensPerPool = nft.metadata?.['attributes'].filter(
    (e) => e.trait_type === 'maxTokensPerPool',
  )?.[0]?.value;

  return (
    <>
      <img className="nft-image" src={nft.image} />
      <div className="token-id">#{nft.tokenID}</div>
      <div className="nft-name">{nft.name}</div>
      {multiplier && (
        <div className="tbill-multiplier">
          Multiplier: {multiplier.toString()}X
        </div>
      )}
      {maxTokensPerPool && (
        <div className="tbill-multiplier">
          Max Tokens: {maxTokensPerPool.toString()}
        </div>
      )}
    </>
  );
};

NFT.propTypes = {
  nft: PropTypes.object.isRequired,
};

export default NFT;
