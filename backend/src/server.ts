import { buildApp } from './app.js';
import { loadEnvOrExit } from './config/env.js';
import { createDatabase, isDatabaseReachable } from './database/connection.js';

const env = loadEnvOrExit();
const db = createDatabase(env.DATABASE_URL);

const app = buildApp(
  { checkDatabase: () => isDatabaseReachable(db) },
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
