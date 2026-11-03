import { composeApp } from './compose-app.js';
import { serverEnvSchema, loadEnvOrExit } from './config/env.js';

const env = loadEnvOrExit(serverEnvSchema);
const app = composeApp(env);

try {
  await app.listen({ port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
