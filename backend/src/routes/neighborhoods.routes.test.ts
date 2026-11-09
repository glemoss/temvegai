import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';

const kairu: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: null,
  openingHours: null,
  createdAt: new Date('2026-10-14T12:00:00Z'),
  updatedAt: new Date('2026-10-14T12:00:00Z'),
};

function makeApp(restaurants: Restaurant[]) {
  return buildApp({
    checkDatabase: async () => true,
    restaurantRepository: new InMemoryRestaurantRepository(restaurants),
    suggestionRepository: new InMemorySuggestionRepository(),
    userRepository: new InMemoryUserRepository(),
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
    corsOrigin: 'http://localhost:5173',
  });
}

describe('GET /neighborhoods', () => {
  it('responds 200 with the neighborhoods and their areas, without a session', async () => {
    const app = makeApp([kairu]);

    const response = await app.inject({ method: 'GET', url: '/neighborhoods' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      neighborhoods: [
        {
          name: 'Rio Tavares',
          bounds: {
            minLat: -27.661458,
            maxLat: -27.661458,
            minLng: -48.499222,
            maxLng: -48.499222,
          },
        },
      ],
    });

    await app.close();
  });

  it('responds 200 with an empty list when there are no restaurants', async () => {
    const app = makeApp([]);

    const response = await app.inject({ method: 'GET', url: '/neighborhoods' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ neighborhoods: [] });

    await app.close();
  });
});
