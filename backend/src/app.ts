import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { GetRestaurantController } from './controllers/get-restaurant.controller.js';
import { ListRestaurantsController } from './controllers/list-restaurants.controller.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import type { RestaurantRepository } from './repositories/restaurant.repository.js';
import { healthRoutes, type DatabaseCheck } from './routes/health.routes.js';
import { restaurantsRoutes } from './routes/restaurants.routes.js';
import { GetRestaurantUseCase } from './use-cases/get-restaurant.use-case.js';
import { ListRestaurantsUseCase } from './use-cases/list-restaurants.use-case.js';

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
  restaurantRepository: RestaurantRepository;
}

export function buildApp(
  { checkDatabase, restaurantRepository }: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);

  const listRestaurantsController = new ListRestaurantsController(
    new ListRestaurantsUseCase(restaurantRepository),
  );
  const getRestaurantController = new GetRestaurantController(
    new GetRestaurantUseCase(restaurantRepository),
  );

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.register(healthRoutes, { checkDatabase });
  app.register(restaurantsRoutes, {
    listRestaurantsController,
    getRestaurantController,
  });

  return app;
}
