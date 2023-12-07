import * as thetajs from '@thetalabs/theta-js';
import { ASSET_MODE, ASSET_TYPE } from '../../../shared/constants/transaction';

const { StakePurpose } = thetajs.constants;

export const HolderLengths = {
  address: 42,
  eenSummary: 524,
  guardianSummary: 460,
};

export function getDefaultPurpose(sendAssetType, forDisplay = false) {
  switch (sendAssetType) {
    case ASSET_TYPE.NATIVE2:
      return StakePurpose.StakeForGuardian;
    case ASSET_TYPE.NATIVE:
      return forDisplay ? undefined : StakePurpose.StakeForEliteEdge;
    default:
      return undefined;
  }
}

export function getHolderLength({ mode, purpose }) {
  if (mode === ASSET_MODE.STAKE) {
    switch (purpose) {
      case StakePurpose.StakeForEliteEdge:
        return HolderLengths.eenSummary;
      case StakePurpose.StakeForGuardian:
        return HolderLengths.guardianSummary;
      default:
        return HolderLengths.address;
    }
  }
  return HolderLengths.address;
}

export function validateHolderOrSummary({
  holderOrSummary = '',
  mode,
  purpose,
  type,
}) {
  const usePurpose = purpose ?? getDefaultPurpose(type);

  let holderSummary, holder;
  let useHolderOrSummary = holderOrSummary.toLowerCase().trim();
  if (useHolderOrSummary.slice(0, 2) !== '0x') {
    useHolderOrSummary = `0x${useHolderOrSummary}`;
  }

  const expectLen = getHolderLength({ mode, purpose: usePurpose });
  const re = new RegExp(`^0x[a-f0-9]{${expectLen - 2}}$`, 'u');
  if (re.test(useHolderOrSummary)) {
    if (useHolderOrSummary.length > HolderLengths.address) {
      holderSummary = useHolderOrSummary;
    }
    holder = useHolderOrSummary.slice(0, HolderLengths.address);
  }

  return {
    valid: typeof holder === 'string',
    holder,
    holderSummary,
  };
}
