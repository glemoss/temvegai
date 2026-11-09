import type { FastifyInstance } from 'fastify';
import type { z } from 'zod';
import { buildApp } from './app.js';
import type { serverEnvSchema } from './config/env.js';
import { createDatabase, isDatabaseReachable } from './database/connection.js';
import { KnexRestaurantRepository } from './repositories/knex/knex-restaurant.repository.js';
import { KnexSuggestionRepository } from './repositories/knex/knex-suggestion.repository.js';
import { KnexUserRepository } from './repositories/knex/knex-user.repository.js';
import { Argon2PasswordHasher } from './services/argon2-password-hasher.js';
import { trustProxyHops } from './trust-proxy.js';

// The only place that picks the implementations, shared by the local server
// (server.ts) and the Vercel function (api/index.ts).
export function composeApp(
  env: z.infer<typeof serverEnvSchema>,
): FastifyInstance {
  // Knex messages, such as connection errors, go to the Fastify logger. The
  // app is only read when a message comes, after it is built below.
  const db = createDatabase(env.DATABASE_URL, {
    warn: (message) => app.log.warn(message),
    error: (message) => app.log.error(message),
    debug: (message) => app.log.debug(message),
    deprecate: (method, alternative) =>
      app.log.warn(`Knex: ${method} is deprecated, use ${alternative}`),
  });

  const app = buildApp(
    {
      checkDatabase: () => isDatabaseReachable(db),
      restaurantRepository: new KnexRestaurantRepository(db),
      suggestionRepository: new KnexSuggestionRepository(db),
      userRepository: new KnexUserRepository(db),
      passwordHasher: new Argon2PasswordHasher(),
      jwtSecret: env.JWT_SECRET,
      cookieSecure: env.NODE_ENV === 'production',
      corsOrigin: env.CORS_ORIGIN,
    },
    { logger: true, trustProxy: trustProxyHops(env.TRUST_PROXY) },
  );

  app.addHook('onClose', async () => {
    await db.destroy();
  });

  return app;
}
