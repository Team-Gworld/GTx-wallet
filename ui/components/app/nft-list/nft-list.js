import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import AddTokenButton from '../add-token-button';
import TokenList from '../token-list';
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import { setSelectedNFT } from '../../../store/actions';

const NFTList = ({ onClickAsset }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  return (
    <>
      <TokenList
        onTokenClick={(tokenAddress) => {
          dispatch(setSelectedNFT(null));
          window.nftSelected = null;
          onClickAsset(tokenAddress);
        }}
        showOnly="nfts"
      />
      <AddTokenButton
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE);
        }}
      />
    </>
  );
};

NFTList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default NFTList;
