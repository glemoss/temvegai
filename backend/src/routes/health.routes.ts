import type { FastifyInstance } from 'fastify';

export type DatabaseCheck = () => Promise<boolean>;

interface HealthRoutesOptions {
  checkDatabase: DatabaseCheck;
}

export async function healthRoutes(
  app: FastifyInstance,
  { checkDatabase }: HealthRoutesOptions,
): Promise<void> {
  app.get('/health', async (_request, reply) => {
    if (await checkDatabase()) {
      return { status: 'ok', database: 'up' };
    }

    return reply.status(503).send({ status: 'error', database: 'down' });
  });
}
