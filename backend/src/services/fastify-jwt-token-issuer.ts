import type { FastifyInstance } from 'fastify';
import type { TokenIssuer } from './token-issuer.js';

// Signs with the @fastify/jwt instance registered in the app, which holds
// the secret and the expiration. `app.jwt` is only read when a token is issued,
// after the plugin has loaded.
export class FastifyJwtTokenIssuer implements TokenIssuer {
  constructor(private readonly app: FastifyInstance) {}

  async issue(userId: string): Promise<string> {
    return this.app.jwt.sign({ sub: userId });
  }
}
