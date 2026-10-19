import type { FastifyInstance } from 'fastify';
import { authenticate } from '../authenticate.js';
import type { GetCurrentAdminController } from '../controllers/get-current-admin.controller.js';
import type { LoginController } from '../controllers/login.controller.js';
import type { LogoutController } from '../controllers/logout.controller.js';

export const LOGIN_RATE_LIMIT = { max: 5, timeWindow: '15 minutes' };

interface AuthRoutesOptions {
  loginController: LoginController;
  logoutController: LogoutController;
  getCurrentAdminController: GetCurrentAdminController;
}

export async function authRoutes(
  app: FastifyInstance,
  {
    loginController,
    logoutController,
    getCurrentAdminController,
  }: AuthRoutesOptions,
): Promise<void> {
  app.post(
    '/auth/login',
    { config: { rateLimit: LOGIN_RATE_LIMIT } },
    loginController.handle,
  );
  app.post('/auth/logout', logoutController.handle);
  app.get(
    '/auth/me',
    { preHandler: authenticate },
    getCurrentAdminController.handle,
  );
}
