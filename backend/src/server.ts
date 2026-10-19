import { buildApp } from './app.js';
import { loadEnvOrExit } from './config/env.js';
import { createDatabase, isDatabaseReachable } from './database/connection.js';
import { KnexRestaurantRepository } from './repositories/knex/knex-restaurant.repository.js';
import { KnexUserRepository } from './repositories/knex/knex-user.repository.js';
import { Argon2PasswordHasher } from './services/argon2-password-hasher.js';

const env = loadEnvOrExit();
const db = createDatabase(env.DATABASE_URL);

const app = buildApp(
  {
    checkDatabase: () => isDatabaseReachable(db),
    restaurantRepository: new KnexRestaurantRepository(db),
    userRepository: new KnexUserRepository(db),
    passwordHasher: new Argon2PasswordHasher(),
    jwtSecret: env.JWT_SECRET,
    cookieSecure: env.NODE_ENV === 'production',
    corsOrigin: env.CORS_ORIGIN,
  },
  { logger: true },
);

app.addHook('onClose', async () => {
  await db.destroy();
});

try {
  await app.listen({ port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
