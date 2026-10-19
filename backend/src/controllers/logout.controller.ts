import type { FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from './session-cookie.js';

export class LogoutController {
  constructor(private readonly cookieSecure: boolean) {}

  handle = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    return reply
      .clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions(this.cookieSecure))
      .status(204)
      .send();
  };
}
