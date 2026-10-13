import { buildApp } from './app.js';

const app = buildApp({ logger: true });

try {
  await app.listen({ port: 3000 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
