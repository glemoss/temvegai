import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { InMemoryRestaurantRepository } from './repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemoryUserRepository } from './repositories/in-memory/in-memory-user.repository.js';

const frontendOrigin = 'http://localhost:5173';

let app: FastifyInstance;
let registeredRoutes: string[];

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

  // The API routes, without the ones added by plugins (docs, CORS preflight)
  // and the HEAD routes Fastify creates for each GET.
  registeredRoutes = [];
  app.addHook('onRoute', ({ method, url }) => {
    if (
      typeof method === 'string' &&
      !['HEAD', 'OPTIONS'].includes(method) &&
      !url.startsWith('/docs')
    ) {
      registeredRoutes.push(`${method} ${url}`);
    }
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

describe('API documentation', () => {
  it('serves the documentation page', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('documents every route of the API', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const paths: Record<string, Record<string, unknown>> = response.json()
      .paths;
    const documentedRoutes = Object.entries(paths).flatMap(
      ([path, operations]) =>
        Object.keys(operations).map(
          (method) =>
            `${method.toUpperCase()} ${path.replace(/{(\w+)}/g, ':$1')}`,
        ),
    );

    expect(registeredRoutes.length).toBeGreaterThan(0);
    expect(documentedRoutes.sort()).toEqual(registeredRoutes.sort());
  });

  it('builds the parameters and bodies from the controller schemas', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const { paths } = response.json();

    const listParameters = paths['/restaurants'].get.parameters.map(
      ({ name }: { name: string }) => name,
    );
    expect(listParameters).toEqual([
      'type',
      'neighborhood',
      'q',
      'minLat',
      'maxLat',
      'minLng',
      'maxLng',
    ]);

    const restaurantBody =
      paths['/restaurants'].post.requestBody.content['application/json'].schema;
    expect(restaurantBody.required).toEqual(
      expect.arrayContaining([
        'name',
        'type',
        'address',
        'neighborhood',
        'latitude',
        'longitude',
      ]),
    );
    expect(restaurantBody.additionalProperties).toBe(false);

    const idParameter = paths['/restaurants/{id}'].get.parameters[0];
    expect(idParameter).toMatchObject({
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    });
  });
});
