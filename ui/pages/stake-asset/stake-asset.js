import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import {
  TFUEL_SYMBOL,
  THETA_SYMBOL,
} from '../../../app/scripts/controllers/network/enums';
import { getTokens } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import NativeStakeAsset from './components/native-stake-asset';
import TokenStakeAsset from './components/token-stake-asset';

const StakeAsset = () => {
  const tokens = useSelector(getTokens);
  const { asset } = useParams();

  const token = tokens.find(({ symbol }) => symbol === asset);

  let content;
  if (token) {
    content = <TokenStakeAsset token={token} />;
  } else if (asset === TFUEL_SYMBOL || asset === THETA_SYMBOL) {
    content = <NativeStakeAsset nativeCurrency={asset} />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default StakeAsset;
