import { EnvHttpProxyAgent } from 'undici';

import { FetchLike } from './client.types';
import { env } from '../../utils/env';

const debug = require('debug')('expo:api:fetch:proxy') as typeof console.log;

// @ts-nocheck
declare const Bun: undefined | object;

/** Wrap fetch with support for proxies. */
export function wrapFetchWithProxy(fetchFunction: FetchLike): FetchLike {
  if (typeof Bun !== 'undefined') {
    return (url, options) =>
      fetchFunction(url, {
        ...(options ||= {}),
        // @ts-ignore-next-line
        // Bun supports a `proxy` option in the fetch function.
        // It will also read `$HTTP_PROXY` and `$HTTPS_PROXY` environment
        // variables by default, but let's not assume that env is the same as
        // process.env.
        proxy: env.HTTP_PROXY,
      });
  }

  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithProxy(url, options = {}) {
    if (!options.dispatcher && env.HTTP_PROXY) {
      debug('Using proxy:', env.HTTP_PROXY);
      options.dispatcher = new EnvHttpProxyAgent();
    }

    return fetchFunction(url, options);
  };
}
