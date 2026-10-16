import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../../entities/restaurant.js';
import { InMemoryRestaurantRepository } from './in-memory-restaurant.repository.js';

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

const tsanThe = makeRestaurant({ id: '1', name: 'Tsan The' });
const desvioVeg = makeRestaurant({ id: '2', name: 'Desvio Veg' });
const kairu = makeRestaurant({ id: '3', name: 'Kairú' });

describe('InMemoryRestaurantRepository', () => {
  it('returns an empty list when there are no restaurants', async () => {
    const repository = new InMemoryRestaurantRepository();

    expect(await repository.findAll({})).toEqual([]);
  });

  it('returns all restaurants ordered by name', async () => {
    const repository = new InMemoryRestaurantRepository([
      tsanThe,
      desvioVeg,
      kairu,
    ]);

    expect(await repository.findAll({})).toEqual([desvioVeg, kairu, tsanThe]);
  });

  it('finds a restaurant by id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe, kairu]);

    expect(await repository.findById('3')).toEqual(kairu);
  });

  it('returns null for an unknown id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe]);

    expect(await repository.findById('999')).toBeNull();
  });
});
