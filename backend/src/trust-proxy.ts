import type { FastifyServerOptions } from 'fastify';

// Trusts the last `hops` entries of X-Forwarded-For, the ones added by the
// proxies in front of the API. Fastify no longer accepts a hop count, because
// it cannot tell a proxy from a client reaching the API directly; this is only
// safe while every request goes through the proxies (Vercel's edge rewrites
// the header). 0 trusts nothing and uses the address of the connection.
export function trustProxyHops(
  hops: number,
): FastifyServerOptions['trustProxy'] {
  return hops > 0 && ((_address, hop) => hop < hops);
}
