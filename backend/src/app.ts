import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { healthRoutes } from './routes/health.routes.js';

export function buildApp(options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(options);

  app.register(healthRoutes);

  return app;
}
