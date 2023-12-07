import { mergeMiddleware } from 'json-rpc-engine';
import createFetchMiddleware from 'eth-json-rpc-middleware/fetch';
import createBlockRefRewriteMiddleware from 'eth-json-rpc-middleware/block-ref-rewrite';
import createBlockCacheMiddleware from 'eth-json-rpc-middleware/block-cache';
import createInflightMiddleware from 'eth-json-rpc-middleware/inflight-cache';
import createBlockTrackerInspectorMiddleware from 'eth-json-rpc-middleware/block-tracker-inspector';
import providerFromMiddleware from 'eth-json-rpc-middleware/providerFromMiddleware';
import { PollingBlockTracker } from 'eth-block-tracker';

export default function createJsonRpcClient({ rpcUrl, blockTrackerOpts }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: blockProvider,
  });

  const networkMiddleware = mergeMiddleware([
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ]);
  return { networkMiddleware, blockTracker };
}
