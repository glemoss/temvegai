import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { ListNeighborhoodsUseCase } from './list-neighborhoods.use-case.js';

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

const desvioVeg = makeRestaurant({
  id: '1',
  neighborhood: 'Centro',
  latitude: -27.598363,
  longitude: -48.548877,
});
const kairu = makeRestaurant({
  id: '2',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
});
const tsanThe = makeRestaurant({
  id: '3',
  neighborhood: 'centro',
  latitude: -27.596349,
  longitude: -48.550833,
});

function makeUseCase(restaurants: Restaurant[]): ListNeighborhoodsUseCase {
  return new ListNeighborhoodsUseCase(
    new InMemoryRestaurantRepository(restaurants),
  );
}

describe('ListNeighborhoodsUseCase', () => {
  it('returns each neighborhood once, ignoring case, ordered by name', async () => {
    const neighborhoods = await makeUseCase([
      kairu,
      tsanThe,
      desvioVeg,
    ]).execute();

    expect(neighborhoods.map(({ name }) => name)).toEqual([
      'Centro',
      'Rio Tavares',
    ]);
  });

  it('returns the area that covers all restaurants of the neighborhood', async () => {
    const [centro] = await makeUseCase([desvioVeg, tsanThe]).execute();

    expect(centro?.bounds).toEqual({
      minLat: -27.598363,
      maxLat: -27.596349,
      minLng: -48.550833,
      maxLng: -48.548877,
    });
  });

  it('returns a single point for a neighborhood with one restaurant', async () => {
    expect(await makeUseCase([kairu]).execute()).toEqual([
      {
        name: 'Rio Tavares',
        bounds: {
          minLat: kairu.latitude,
          maxLat: kairu.latitude,
          minLng: kairu.longitude,
          maxLng: kairu.longitude,
        },
      },
    ]);
  });

  it('returns an empty list when there are no restaurants', async () => {
    expect(await makeUseCase([]).execute()).toEqual([]);
  });
});
