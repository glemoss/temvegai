import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { LoginUseCase } from '../use-cases/login.use-case.js';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from './session-cookie.js';

export const bodySchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

export class LoginController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly cookieSecure: boolean,
  ) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const input = bodySchema.parse(request.body);

    const { user, token } = await this.login.execute(input);

    return reply
      .setCookie(SESSION_COOKIE_NAME, token, {
        ...sessionCookieOptions(this.cookieSecure),
        maxAge: SESSION_MAX_AGE_SECONDS,
      })
      .status(200)
      .send({ user });
  };
}
