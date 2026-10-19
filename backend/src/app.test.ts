import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { InMemoryRestaurantRepository } from './repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemoryUserRepository } from './repositories/in-memory/in-memory-user.repository.js';

const frontendOrigin = 'http://localhost:5173';

let app: FastifyInstance;

beforeEach(async () => {
  app = buildApp({
    checkDatabase: async () => true,
    restaurantRepository: new InMemoryRestaurantRepository(),
    userRepository: new InMemoryUserRepository(),
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
    corsOrigin: frontendOrigin,
  });

  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function preflight(origin: string, method: string) {
  return app.inject({
    method: 'OPTIONS',
    url: '/restaurants/6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
    headers: {
      origin,
      'access-control-request-method': method,
    },
  });
}

describe('CORS', () => {
  it.each(['GET', 'POST', 'PUT', 'DELETE'])(
    'allows %s from the frontend origin with credentials',
    async (method) => {
      const response = await preflight(frontendOrigin, method);

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        frontendOrigin,
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain(
        method,
      );
    },
  );

  it('sends the CORS headers on regular responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/restaurants',
      headers: { origin: frontendOrigin },
    });

    expect(response.headers['access-control-allow-origin']).toBe(
      frontendOrigin,
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  // The allowed origin is fixed, so the browser of any other site sees a
  // mismatch and blocks the response.
  it('does not allow other origins', async () => {
    const response = await preflight('http://evil.example', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe(
      frontendOrigin,
    );
  });
});
