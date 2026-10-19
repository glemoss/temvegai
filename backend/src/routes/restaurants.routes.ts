import type { FastifyInstance } from 'fastify';
import { authenticate } from '../authenticate.js';
import type { CreateRestaurantController } from '../controllers/create-restaurant.controller.js';
import type { DeleteRestaurantController } from '../controllers/delete-restaurant.controller.js';
import type { GetRestaurantController } from '../controllers/get-restaurant.controller.js';
import type { ListRestaurantsController } from '../controllers/list-restaurants.controller.js';
import type { UpdateRestaurantController } from '../controllers/update-restaurant.controller.js';

interface RestaurantsRoutesOptions {
  listRestaurantsController: ListRestaurantsController;
  getRestaurantController: GetRestaurantController;
  createRestaurantController: CreateRestaurantController;
  updateRestaurantController: UpdateRestaurantController;
  deleteRestaurantController: DeleteRestaurantController;
}

export async function restaurantsRoutes(
  app: FastifyInstance,
  {
    listRestaurantsController,
    getRestaurantController,
    createRestaurantController,
    updateRestaurantController,
    deleteRestaurantController,
  }: RestaurantsRoutesOptions,
): Promise<void> {
  app.get('/restaurants', listRestaurantsController.handle);
  app.get('/restaurants/:id', getRestaurantController.handle);
  app.post(
    '/restaurants',
    { preHandler: authenticate },
    createRestaurantController.handle,
  );
  app.put(
    '/restaurants/:id',
    { preHandler: authenticate },
    updateRestaurantController.handle,
  );
  app.delete(
    '/restaurants/:id',
    { preHandler: authenticate },
    deleteRestaurantController.handle,
  );
}
