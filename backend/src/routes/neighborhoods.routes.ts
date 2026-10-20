import type { FastifyInstance } from 'fastify';
import type { ListNeighborhoodsController } from '../controllers/list-neighborhoods.controller.js';

interface NeighborhoodsRoutesOptions {
  listNeighborhoodsController: ListNeighborhoodsController;
}

export async function neighborhoodsRoutes(
  app: FastifyInstance,
  { listNeighborhoodsController }: NeighborhoodsRoutesOptions,
): Promise<void> {
  app.get('/neighborhoods', listNeighborhoodsController.handle);
}
