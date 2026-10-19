import { describe, expect, it } from 'vitest';
import { buildApp, type AppDependencies } from '../app.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';

function dependencies(checkDatabase: () => Promise<boolean>): AppDependencies {
  return {
    checkDatabase,
    restaurantRepository: new InMemoryRestaurantRepository(),
    userRepository: new InMemoryUserRepository(),
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
    corsOrigin: 'http://localhost:5173',
  };
}

describe('GET /health', () => {
  it('responds 200 when the database is reachable', async () => {
    const app = buildApp(dependencies(async () => true));

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'up' });

    await app.close();
  });

  it('responds 503 when the database is unreachable', async () => {
    const app = buildApp(dependencies(async () => false));

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'error', database: 'down' });

    await app.close();
  });
});
