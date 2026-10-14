import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { healthRoutes, type DatabaseCheck } from './routes/health.routes.js';

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
}

export function buildApp(
  { checkDatabase }: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);

  app.register(healthRoutes, { checkDatabase });

  return app;
}
