import { buildApp } from './app.js';
import { InvalidEnvError, loadEnv, type Env } from './config/env.js';
import { createDatabase, isDatabaseReachable } from './database/connection.js';

function loadEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (error) {
    if (error instanceof InvalidEnvError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

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
