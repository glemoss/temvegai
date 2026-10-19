import type { CookieSerializeOptions } from '@fastify/cookie';

export const SESSION_COOKIE_NAME = 'token';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// The JavaScript of the page cannot read the cookie (httpOnly); it is only
// sent over HTTPS in production (secure).
export function sessionCookieOptions(secure: boolean): CookieSerializeOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/' };
}
