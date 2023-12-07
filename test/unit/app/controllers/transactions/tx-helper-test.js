import { strict as assert } from 'assert';
import txHelper from '../../../../../ui/lib/tx-helper';

describe('txHelper', function () {
  it('always shows the oldest tx first', function () {
    const metamaskNetworkId = '1';
    const chainId = '0x1';
    const txs = {
      a: { metamaskNetworkId, time: 3 },
      b: { metamaskNetworkId, time: 1 },
      c: { metamaskNetworkId, time: 2 },
    };

    const sorted = txHelper(
      txs,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      metamaskNetworkId,
      chainId,
      undefined,
    );
    assert.equal(sorted[0].time, 1, 'oldest tx first');
    assert.equal(sorted[2].time, 3, 'newest tx last');
  });
});
