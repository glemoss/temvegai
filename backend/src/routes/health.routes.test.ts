import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';

describe('GET /health', () => {
  it('responds 200 when the database is reachable', async () => {
    const app = buildApp({
      checkDatabase: async () => true,
      restaurantRepository: new InMemoryRestaurantRepository(),
    });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'up' });

    await app.close();
  });

  it('responds 503 when the database is unreachable', async () => {
    const app = buildApp({
      checkDatabase: async () => false,
      restaurantRepository: new InMemoryRestaurantRepository(),
    });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'error', database: 'down' });

    await app.close();
  });
});
