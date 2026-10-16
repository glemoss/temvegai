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

const desvioVeg = makeRestaurant({
  id: '1',
  name: 'Desvio Veg',
  neighborhood: 'Centro',
  latitude: -27.598363,
  longitude: -48.548877,
});
const kairu = makeRestaurant({
  id: '2',
  name: 'Kairú',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
});
const tsanThe = makeRestaurant({
  id: '3',
  name: 'Tsan The',
  type: 'vegan_options',
  neighborhood: 'Centro',
  latitude: -27.596349,
  longitude: -48.550833,
});

// A box around downtown Florianópolis, which leaves Kairú (Rio Tavares) out.
const downtown = {
  minLat: -27.6,
  maxLat: -27.59,
  minLng: -48.56,
  maxLng: -48.54,
};

function makeUseCase(): ListRestaurantsUseCase {
  return new ListRestaurantsUseCase(
    new InMemoryRestaurantRepository([tsanThe, kairu, desvioVeg]),
  );
}

describe('ListRestaurantsUseCase', () => {
  it('returns all restaurants ordered by name when there are no filters', async () => {
    expect(await makeUseCase().execute()).toEqual([desvioVeg, kairu, tsanThe]);
  });

  it('returns an empty list when there are no restaurants', async () => {
    const useCase = new ListRestaurantsUseCase(
      new InMemoryRestaurantRepository(),
    );

    expect(await useCase.execute()).toEqual([]);
  });

  it('filters by type', async () => {
    expect(await makeUseCase().execute({ type: 'vegan_options' })).toEqual([
      tsanThe,
    ]);
  });

  it('filters by neighborhood ignoring case', async () => {
    expect(await makeUseCase().execute({ neighborhood: 'centro' })).toEqual([
      desvioVeg,
      tsanThe,
    ]);
  });

  it('filters by part of the name ignoring case and accents', async () => {
    expect(await makeUseCase().execute({ name: 'KAIRU' })).toEqual([kairu]);
    expect(await makeUseCase().execute({ name: 'veg' })).toEqual([desvioVeg]);
  });

  it('filters by map bounds', async () => {
    expect(await makeUseCase().execute({ bounds: downtown })).toEqual([
      desvioVeg,
      tsanThe,
    ]);
  });

  it('includes restaurants exactly on the bounds edge', async () => {
    const bounds = {
      minLat: kairu.latitude,
      maxLat: kairu.latitude,
      minLng: kairu.longitude,
      maxLng: kairu.longitude,
    };

    expect(await makeUseCase().execute({ bounds })).toEqual([kairu]);
  });

  it('combines filters', async () => {
    expect(
      await makeUseCase().execute({
        type: 'fully_vegan',
        neighborhood: 'Centro',
        bounds: downtown,
      }),
    ).toEqual([desvioVeg]);
  });

  it('returns an empty list when nothing matches', async () => {
    expect(await makeUseCase().execute({ name: 'pizza' })).toEqual([]);
  });
});
