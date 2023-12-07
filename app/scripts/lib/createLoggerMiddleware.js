import log from 'loglevel';

/**
 * Returns a middleware that logs RPC activity
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export default function createLoggerMiddleware(opts) {
  return function loggerMiddleware(
    /** @type {any} */ req,
    /** @type {any} */ res,
    /** @type {Function} */ next,
  ) {
    next((/** @type {Function} */ cb) => {
      if (res.error) {
        if (res.error.code === 4001){
          log.info(res.error.message);
        } else {
          log.error('Error in RPC response:\n', res);
        }        
      }
      if (req.isMetamaskInternal) {
        return;
      }
      log.info(`RPC (${opts.origin}):`, req, '->', res);
      cb();
    });
  };
}
