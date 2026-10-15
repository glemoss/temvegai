import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { ListRestaurantsUseCase } from './list-restaurants.use-case.js';

function makeRestaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Restaurante',
    description: null,
    type: 'fully_vegan',
    address: 'Rua Exemplo, 1',
    neighborhood: 'Centro',
    latitude: -27.5969,
    longitude: -48.5495,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
    createdAt: new Date('2026-10-14T12:00:00Z'),
    updatedAt: new Date('2026-10-14T12:00:00Z'),
    ...overrides,
  };
}

describe('ListRestaurantsUseCase', () => {
  it('returns the restaurants ordered by name', async () => {
    const tsanThe = makeRestaurant({ id: '1', name: 'Tsan The' });
    const kairu = makeRestaurant({ id: '2', name: 'Kairú' });
    const useCase = new ListRestaurantsUseCase(
      new InMemoryRestaurantRepository([tsanThe, kairu]),
    );

    expect(await useCase.execute()).toEqual([kairu, tsanThe]);
  });

  it('returns an empty list when there are no restaurants', async () => {
    const useCase = new ListRestaurantsUseCase(
      new InMemoryRestaurantRepository(),
    );

    expect(await useCase.execute()).toEqual([]);
  });
});
