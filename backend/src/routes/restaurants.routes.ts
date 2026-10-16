import type { FastifyInstance } from 'fastify';
import type { GetRestaurantController } from '../controllers/get-restaurant.controller.js';
import type { ListRestaurantsController } from '../controllers/list-restaurants.controller.js';

interface RestaurantsRoutesOptions {
  listRestaurantsController: ListRestaurantsController;
  getRestaurantController: GetRestaurantController;
}

export async function restaurantsRoutes(
  app: FastifyInstance,
  {
    listRestaurantsController,
    getRestaurantController,
  }: RestaurantsRoutesOptions,
): Promise<void> {
  app.get('/restaurants', listRestaurantsController.handle);
  app.get('/restaurants/:id', getRestaurantController.handle);
}
