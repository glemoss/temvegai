import type { FastifyInstance } from 'fastify';
import type { ListRestaurantsController } from '../controllers/list-restaurants.controller.js';

interface RestaurantsRoutesOptions {
  listRestaurantsController: ListRestaurantsController;
}

export async function restaurantsRoutes(
  app: FastifyInstance,
  { listRestaurantsController }: RestaurantsRoutesOptions,
): Promise<void> {
  app.get('/restaurants', listRestaurantsController.handle);
}
