import EthQuery from 'eth-query';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import pify from 'pify';
import { BN } from 'bn.js';
import { hexToBn } from '../../lib/util';
import {
  GAS_PRICING_INIT,
  THETAMAINNET_NETWORK_ID,
  THETA_GASPRICE_GWEI_DEC,
} from '../network/enums';

export const baseFeeMultiplier = 1.2;

export default class GasPricingTracker {
  constructor(opts) {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._updateForBlock = this._updateForBlock.bind(this);
    this._updateGasPricing = this._updateGasPricing.bind(this);
    this._queryBasicGasPrice = this._queryBasicGasPrice.bind(this);
    this._queryFeeHistory = this._queryFeeHistory.bind(this);
    this._queryMinPriorityFee = this._queryMinPriorityFee.bind(this);

    const initState = opts.initState || {
      gasPricing: {
        ...GAS_PRICING_INIT,
      },
    };
    initState.stale = true;
    this.store = new ObservableStore(initState);

    this._networkController = opts.networkController;
    this._provider = opts.provider;
    this._query = pify(new EthQuery(this._provider));
    this._blockTracker = opts.blockTracker;
    this._addFeeHistoryToQuery();
    this._addMaxPriorityFeePerGasToQuery();
    this._minUpdateInterval = opts.minUpdateInterval || 5000;
    this._lastUpdated = 0;
    this._currentBlockNumber = this._blockTracker.getCurrentBlock();
    this._blockTracker.once('latest', (blockNumber) => {
      this._currentBlockNumber = blockNumber;
    });
  }

  start() {
    // remove first to avoid double add
    this._blockTracker.removeListener('latest', this._updateForBlock);
    // add listener
    this._blockTracker.addListener('latest', this._updateForBlock);
    // fetch network info and gasFeeEstimates
    this._currentBlockNumber = this._blockTracker.getCurrentBlock();
    this._updateForBlock(this._currentBlockNumber);
  }

  stop() {
    // remove listener
    this._blockTracker.removeListener('latest', this._updateForBlock);
  }

  getCurrentNetworkEip1559Compatible() {
    const state = this.store.getState();
    const currentNetwork = this._networkController.getNetworkState();
    if (!currentNetwork) {
      return undefined;
    }
    return state.gasPricing[currentNetwork]?.eip1559Compatible;
  }

  /**
   * Gets basic gas fee estimates object
   * @param {string} networkId - metamask network ID string
   * @returns {Object} basicGasEstimates in GWEI as numbers { baseFee, safeLow, average, fast }
   */
  getBasicGasEstimates(networkId) {
    const useNetworkId = networkId ?? this._networkController.getNetworkState();
    if (!useNetworkId) {
      return undefined;
    }
    const state = this.store.getState();
    return state.gasPricing[useNetworkId]?.basicGasEstimates;
  }

  _addMaxPriorityFeePerGasToQuery() {
    const query = this._query;
    query.maxPriorityFeePerGas = function (...rest) {
      const cb = rest[0];
      query.sendAsync(
        {
          method: 'eth_maxPriorityFeePerGas',
          params: [],
        },
        cb,
      );
    };
  }

  _addFeeHistoryToQuery() {
    const query = this._query;
    query.feeHistory = function (
      blockCount,
      newestBlock,
      rewardPercentiles,
      ...rest
    ) {
      const cb = rest[0];
      query.sendAsync(
        {
          method: 'eth_feeHistory',
          params: [blockCount, newestBlock, rewardPercentiles],
        },
        cb,
      );
    };
  }

  /**
   * @private
   * @param {number} blockNumber - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   *
   */
  async _updateForBlock(blockNumber) {
    // TODO: don't update for THETA_MAINNET because price and block limit are static
    if (blockNumber === null || blockNumber === undefined) {
      return;
    }
    this._currentBlockNumber = blockNumber;

    let currentBlock;
    try {
      currentBlock = await this._query.getBlockByNumber(blockNumber, false);
    } catch (err) {
      log.error(err);
    }
    if (!currentBlock) {
      return;
    }
    const eip1559Compatible = Boolean(currentBlock.baseFeePerGas);
    const { gasLimit } = currentBlock;
    const baseFeePerGas = eip1559Compatible
      ? hexToBn(currentBlock.baseFeePerGas).toNumber() / 1e9
      : undefined;

    const currentNetwork = this._networkController.getNetworkState();
    if (!currentNetwork) {
      return;
    }
    const { gasPricing } = this.store.getState();
    gasPricing[currentNetwork] = {
      ...gasPricing[currentNetwork],
      gasLimit, // TODO: remove redundancy
      eip1559Compatible,
    };
    this.store.updateState({ gasPricing });

    try {
      const interval = Date.now() - this._lastUpdated;
      if (interval < this._minUpdateInterval) {
        return;
      }
      await this._updateGasPricing(
        currentNetwork,
        eip1559Compatible,
        baseFeePerGas,
      );
    } catch (err) {
      log.error(err);
    }
  }

  async _updateGasPricing(networkAtStart, eip1559Compatible, baseFeePerGas) {
    // TODO: replace with a method that accounts for time to confirm
    const [gasPrice, minPriorityFee, feeHistory] = await Promise.all([
      this._queryBasicGasPrice(),
      eip1559Compatible ? this._queryMinPriorityFee() : Promise.resolve(),
      eip1559Compatible
        ? this._queryFeeHistory(10, 'latest', [33, 50, 80])
        : Promise.resolve(), // will yield safe low normal, medium, and high values
    ]);
    const currentNetwork = this._networkController.getNetworkState();
    if (currentNetwork !== networkAtStart) {
      return false;
    }

    let safeLow, average, fast, baseFee;
    if (currentNetwork === THETAMAINNET_NETWORK_ID) {
      average = THETA_GASPRICE_GWEI_DEC;
      safeLow = average;
      fast = average;
    } else if (minPriorityFee) {
      baseFee = Math.ceil(10 * (baseFeePerGas || gasPrice)) / 10;
      if (feeHistory) {
        const avgNum = (nums) =>
          Math.ceil(
            10 *
              (nums
                .reduce((accum, val) => hexToBn(accum).add(hexToBn(val)))
                .div(new BN(nums.length, 10))
                .toNumber() /
                1e9),
          ) / 10;
        let items = feeHistory.reward
          .map((b) => b[0])
          .filter((r) => Boolean(r));
        if (items.length) {
          safeLow = avgNum(items);
        }
        items = feeHistory.reward.map((b) => b[1]).filter((r) => Boolean(r));
        if (items.length) {
          average = avgNum(items);
        }
        items = feeHistory.reward.map((b) => b[2]).filter((r) => Boolean(r));
        if (items.length) {
          fast = avgNum(items);
        }
      }

      if (!average) {
        if (safeLow && fast) {
          average = (safeLow + fast) / 2;
        } else {
          average = minPriorityFee * 30;
        }
      }
      if (average < 1 || !average) {
        average = 1;
      }
      if (average < minPriorityFee + 0.1) {
        average = Math.ceil(10 * (minPriorityFee + 0.1)) / 10;
      }

      if (!fast) {
        fast = average * 4;
      }
      if (fast < 2) {
        fast = 2;
      }
      if (fast < minPriorityFee + 1.5) {
        fast = Math.ceil(10 * (minPriorityFee + 1.5)) / 10;
      }

      if (!safeLow) {
        safeLow = average / 2;
      }
      if (safeLow < minPriorityFee + 0.05) {
        safeLow = Math.ceil(10 * (minPriorityFee + 0.05)) / 10;
      }
      if (safeLow < minPriorityFee * 1.1) {
        safeLow = Math.ceil(10 * (minPriorityFee * 1.1)) / 10;
      }
      if (safeLow < 0.1) {
        safeLow = 0.1;
      }
    } else {
      safeLow = Math.ceil(10 * gasPrice * 0.9) / 10;
      average = Math.ceil(10 * gasPrice) / 10;
      fast = Math.ceil(10 * gasPrice * 1.2) / 10;
    }

    const basicGasEstimates = {
      ...(baseFee && { baseFee }),
      safeLow,
      average,
      fast,
    };
    log.debug('GasFeeTracker.basicGasEstimates: ', basicGasEstimates);

    const { gasPricing } = this.store.getState();
    gasPricing[currentNetwork] = {
      ...gasPricing[currentNetwork],
      basicGasEstimates,
    };
    this.store.updateState({ gasPricing });
    this._lastUpdated = Date.now();

    /*
    const timeRetrieved = Date.now()
    saveLocalStorageData(basicEstimates, 'BASIC_PRICE_ESTIMATES')
    saveLocalStorageData(timeRetrieved, 'BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
    dispatch(setBasicPriceEstimatesLastRetrieved(timeRetrieved))
    */

    return true;
  }

  async _queryBasicGasPrice() {
    const gasPrice = await this._query.gasPrice();
    return gasPrice && hexToBn(gasPrice).toNumber() / 1e9;
  }

  async _queryMinPriorityFee() {
    try {
      const fee = await this._query.maxPriorityFeePerGas();
      return fee && hexToBn(fee).toNumber() / 1e9;
    } catch (err) {
      return undefined;
    }
  }

  async _queryFeeHistory(blocks, lastBlock, percentiles) {
    try {
      const history = await this._query.feeHistory(
        blocks,
        lastBlock,
        percentiles,
      );
      return history;
    } catch (err) {
      return undefined;
    }
  }
}
