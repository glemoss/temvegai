import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { z } from 'zod';
import { CreateRestaurantController } from './controllers/create-restaurant.controller.js';
import { CreateSuggestionController } from './controllers/create-suggestion.controller.js';
import { DeleteRestaurantController } from './controllers/delete-restaurant.controller.js';
import { GetCurrentAdminController } from './controllers/get-current-admin.controller.js';
import { GetRestaurantController } from './controllers/get-restaurant.controller.js';
import { ListNeighborhoodsController } from './controllers/list-neighborhoods.controller.js';
import { ListRestaurantsController } from './controllers/list-restaurants.controller.js';
import { ListSuggestionsController } from './controllers/list-suggestions.controller.js';
import { LoginController } from './controllers/login.controller.js';
import { LogoutController } from './controllers/logout.controller.js';
import { RejectSuggestionController } from './controllers/reject-suggestion.controller.js';
import { RetrySuggestionController } from './controllers/retry-suggestion.controller.js';
import type { RunInBackground } from './controllers/run-in-background.js';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from './controllers/session-cookie.js';
import { UpdateRestaurantController } from './controllers/update-restaurant.controller.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import { openApiDocument } from './openapi.js';
import type { RestaurantRepository } from './repositories/restaurant.repository.js';
import type { SuggestionRepository } from './repositories/suggestion.repository.js';
import type { UserRepository } from './repositories/user.repository.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes, type DatabaseCheck } from './routes/health.routes.js';
import { neighborhoodsRoutes } from './routes/neighborhoods.routes.js';
import { restaurantsRoutes } from './routes/restaurants.routes.js';
import { suggestionsRoutes } from './routes/suggestions.routes.js';
import { FastifyJwtTokenIssuer } from './services/fastify-jwt-token-issuer.js';
import type { PasswordHasher } from './services/password-hasher.js';
import type { RestaurantDraftGenerator } from './services/restaurant-draft-generator.js';
import { CreateRestaurantUseCase } from './use-cases/create-restaurant.use-case.js';
import { CreateSuggestionUseCase } from './use-cases/create-suggestion.use-case.js';
import { DeleteRestaurantUseCase } from './use-cases/delete-restaurant.use-case.js';
import { GetCurrentAdminUseCase } from './use-cases/get-current-admin.use-case.js';
import { GetRestaurantUseCase } from './use-cases/get-restaurant.use-case.js';
import { ListNeighborhoodsUseCase } from './use-cases/list-neighborhoods.use-case.js';
import { ListRestaurantsUseCase } from './use-cases/list-restaurants.use-case.js';
import { ListSuggestionsUseCase } from './use-cases/list-suggestions.use-case.js';
import { LoginUseCase } from './use-cases/login.use-case.js';
import { ProcessSuggestionUseCase } from './use-cases/process-suggestion.use-case.js';
import { RejectSuggestionUseCase } from './use-cases/reject-suggestion.use-case.js';
import { RetrySuggestionUseCase } from './use-cases/retry-suggestion.use-case.js';
import { UpdateRestaurantUseCase } from './use-cases/update-restaurant.use-case.js';

// Validation messages of the API in Portuguese, like the rest of its errors.
z.config(z.locales.ptBR());

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
  restaurantRepository: RestaurantRepository;
  suggestionRepository: SuggestionRepository;
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  restaurantDraftGenerator: RestaurantDraftGenerator;
  runInBackground: RunInBackground;
  jwtSecret: string;
  cookieSecure: boolean;
  corsOrigin: string;
}

export function buildApp(
  {
    checkDatabase,
    restaurantRepository,
    suggestionRepository,
    userRepository,
    passwordHasher,
    restaurantDraftGenerator,
    runInBackground,
    jwtSecret,
    cookieSecure,
    corsOrigin,
  }: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);

  const listRestaurantsController = new ListRestaurantsController(
    new ListRestaurantsUseCase(restaurantRepository),
  );
  const getRestaurantController = new GetRestaurantController(
    new GetRestaurantUseCase(restaurantRepository),
  );
  const createRestaurantController = new CreateRestaurantController(
    new CreateRestaurantUseCase(restaurantRepository),
  );
  const updateRestaurantController = new UpdateRestaurantController(
    new UpdateRestaurantUseCase(restaurantRepository),
  );
  const deleteRestaurantController = new DeleteRestaurantController(
    new DeleteRestaurantUseCase(restaurantRepository),
  );
  const listNeighborhoodsController = new ListNeighborhoodsController(
    new ListNeighborhoodsUseCase(restaurantRepository),
  );
  const processSuggestion = new ProcessSuggestionUseCase(
    suggestionRepository,
    restaurantDraftGenerator,
  );
  const createSuggestionController = new CreateSuggestionController(
    new CreateSuggestionUseCase(suggestionRepository),
    processSuggestion,
    runInBackground,
  );
  const listSuggestionsController = new ListSuggestionsController(
    new ListSuggestionsUseCase(suggestionRepository),
  );
  const rejectSuggestionController = new RejectSuggestionController(
    new RejectSuggestionUseCase(suggestionRepository),
  );
  const retrySuggestionController = new RetrySuggestionController(
    new RetrySuggestionUseCase(suggestionRepository),
    processSuggestion,
    runInBackground,
  );
  const loginController = new LoginController(
    new LoginUseCase(
      userRepository,
      passwordHasher,
      new FastifyJwtTokenIssuer(app),
    ),
    cookieSecure,
  );
  const logoutController = new LogoutController(cookieSecure);
  const getCurrentAdminController = new GetCurrentAdminController(
    new GetCurrentAdminUseCase(userRepository),
  );

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // credentials lets the browser send the session cookie from the frontend.
  app.register(fastifyCors, {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  app.register(fastifyCookie);
  app.register(fastifyJwt, {
    secret: jwtSecret,
    cookie: { cookieName: SESSION_COOKIE_NAME, signed: false },
    // @fastify/jwt reads a numeric expiresIn as seconds.
    sign: { expiresIn: SESSION_MAX_AGE_SECONDS },
    verify: { onlyCookie: true },
  });
  // Off by default; only routes with `config.rateLimit` are limited.
  app.register(fastifyRateLimit, { global: false });

  app.register(fastifySwagger, {
    mode: 'static',
    specification: { document: openApiDocument },
  });
  app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  app.register(healthRoutes, { checkDatabase });
  app.register(restaurantsRoutes, {
    listRestaurantsController,
    getRestaurantController,
    createRestaurantController,
    updateRestaurantController,
    deleteRestaurantController,
  });
  app.register(neighborhoodsRoutes, { listNeighborhoodsController });
  app.register(suggestionsRoutes, {
    createSuggestionController,
    listSuggestionsController,
    rejectSuggestionController,
    retrySuggestionController,
  });
  app.register(authRoutes, {
    loginController,
    logoutController,
    getCurrentAdminController,
  });

  return app;
}
