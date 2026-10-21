import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { RestaurantNotFoundError } from './errors/restaurant-not-found.error.js';
import { GetRestaurantUseCase } from './get-restaurant.use-case.js';

const kairu: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: '(48) 99124-2935',
  website: null,
  instagram: 'kairu.veg',
  openingHours: {
    monday: [{ opens: '19:00', closes: '23:00' }],
    tuesday: [],
    wednesday: [{ opens: '19:00', closes: '23:00' }],
    thursday: [{ opens: '19:00', closes: '23:00' }],
    friday: [{ opens: '19:00', closes: '23:00' }],
    saturday: [{ opens: '19:00', closes: '23:00' }],
    sunday: [{ opens: '19:00', closes: '23:00' }],
  },
  createdAt: new Date('2026-10-14T12:00:00Z'),
  updatedAt: new Date('2026-10-14T12:00:00Z'),
};

describe('GetRestaurantUseCase', () => {
  it('returns the restaurant with the given id', async () => {
    const useCase = new GetRestaurantUseCase(
      new InMemoryRestaurantRepository([kairu]),
    );

    expect(await useCase.execute(kairu.id)).toEqual(kairu);
  });

  it('throws RestaurantNotFoundError for an unknown id', async () => {
    const useCase = new GetRestaurantUseCase(
      new InMemoryRestaurantRepository([kairu]),
    );

    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(RestaurantNotFoundError);
  });
});
