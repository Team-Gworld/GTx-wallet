import assert from 'assert';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const fakeLocalStorage = {};

const GasDuck = proxyquire('./gas.duck.js', {
  '../lib/local-storage-helpers': fakeLocalStorage,
});

const {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  setCustomGasTotal,
  setCustomGasErrors,
  resetCustomGasState,
  fetchBasicGasEstimates,
} = GasDuck;
const GasReducer = GasDuck.default;

describe('Gas Duck', function () {
  let tempFetch;
  let tempDateNow;
  const mockGasApiResponse = {
    FastGasPrice: 30,
    ProposeGasPrice: 20,
    SafeGasPrice: 10,
  };
  const fakeFetch = () =>
    new Promise((resolve) => {
      const dataToResolve = mockGasApiResponse;
      resolve({
        json: () => Promise.resolve(dataToResolve),
      });
    });

  beforeEach(function () {
    tempFetch = window.fetch;
    tempDateNow = global.Date.now;

    fakeLocalStorage.loadLocalStorageData = sinon.stub();
    fakeLocalStorage.saveLocalStorageData = sinon.spy();
    window.fetch = sinon.stub().callsFake(fakeFetch);
    global.Date.now = () => 2000000;
  });

  afterEach(function () {
    sinon.restore();

    window.fetch = tempFetch;
    global.Date.now = tempDateNow;
  });

  const mockState = {
    mockProp: 123,
  };
  const initState = {
    customData: {
      price: null,
      limit: null,
    },
    basicEstimates: {
      average: null,
      fast: null,
      safeLow: null,
    },
    basicEstimateIsLoading: true,
    errors: {},
    basicPriceEstimatesLastRetrieved: 0,
  };
  const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED';
  const BASIC_GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED';
  const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE';
  const SET_BASIC_GAS_ESTIMATE_DATA =
    'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
  const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS';
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE';
  const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL';
  const SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED =
    'metamask/gas/SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED';

  describe('GasReducer()', function () {
    it('should initialize state', function () {
      assert.deepEqual(GasReducer(undefined, {}), initState);
    });

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState,
      );
    });

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }),
        { basicEstimateIsLoading: true, ...mockState },
      );
    });

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }),
        { basicEstimateIsLoading: false, ...mockState },
      );
    });

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
        { basicEstimates: { someProp: 'someData123' }, ...mockState },
      );
    });

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
        { customData: { price: 4321 }, ...mockState },
      );
    });

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
        { customData: { limit: 9876 }, ...mockState },
      );
    });

    it('should set customData.total when receiving a SET_CUSTOM_GAS_TOTAL action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_TOTAL,
          value: 10000,
        }),
        { customData: { total: 10000 }, ...mockState },
      );
    });

    it('should set errors when receiving a SET_CUSTOM_GAS_ERRORS action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_ERRORS,
          value: { someError: 'error_error' },
        }),
        { errors: { someError: 'error_error' }, ...mockState },
      );
    });

    it('should return the initial state in response to a RESET_CUSTOM_GAS_STATE action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: RESET_CUSTOM_GAS_STATE }),
        initState,
      );
    });
  });

  describe('basicGasEstimatesLoadingStarted', function () {
    it('should create the correct action', function () {
      assert.deepEqual(basicGasEstimatesLoadingStarted(), {
        type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
      });
    });
  });

  describe('basicGasEstimatesLoadingFinished', function () {
    it('should create the correct action', function () {
      assert.deepEqual(basicGasEstimatesLoadingFinished(), {
        type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
      });
    });
  });

  describe('fetchBasicGasEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy();

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState, basicPriceAEstimatesLastRetrieved: 1000000 },
      }));
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
        'should fetch gas prices',
      );
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ]);
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2 * 10,
            fast: 3 * 10,
            safeLow: 1 * 10,
          },
        },
      ]);
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should fetch recently retrieved estimates from local storage', async function () {
      const mockDistpatch = sinon.spy();
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1); // one second ago from "now"
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES')
        .returns({
          average: 25,
          fast: 35,
          safeLow: 15,
        });

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }));
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(window.fetch.notCalled);
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 25,
            fast: 35,
            safeLow: 15,
          },
        },
      ]);
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should fallback to network if retrieving estimates from local storage fails', async function () {
      const mockDistpatch = sinon.spy();
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1); // one second ago from "now"

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }));
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
        'should fetch gas prices',
      );
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ]);
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2 * 10,
            fast: 3 * 10,
            safeLow: 1 * 10,
          },
        },
      ]);
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });
  });

  describe('setBasicGasEstimateData', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setBasicGasEstimateData('mockBasicEstimatData'), {
        type: SET_BASIC_GAS_ESTIMATE_DATA,
        value: 'mockBasicEstimatData',
      });
    });
  });

  describe('setCustomGasPrice', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasPrice('mockCustomGasPrice'), {
        type: SET_CUSTOM_GAS_PRICE,
        value: 'mockCustomGasPrice',
      });
    });
  });

  describe('setCustomGasLimit', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasLimit('mockCustomGasLimit'), {
        type: SET_CUSTOM_GAS_LIMIT,
        value: 'mockCustomGasLimit',
      });
    });
  });

  describe('setCustomGasTotal', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasTotal('mockCustomGasTotal'), {
        type: SET_CUSTOM_GAS_TOTAL,
        value: 'mockCustomGasTotal',
      });
    });
  });

  describe('setCustomGasErrors', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasErrors('mockErrorObject'), {
        type: SET_CUSTOM_GAS_ERRORS,
        value: 'mockErrorObject',
      });
    });
  });

  describe('resetCustomGasState', function () {
    it('should create the correct action', function () {
      assert.deepEqual(resetCustomGasState(), { type: RESET_CUSTOM_GAS_STATE });
    });
  });
});
