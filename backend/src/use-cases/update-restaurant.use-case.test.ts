import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import type { RestaurantData } from '../repositories/restaurant.repository.js';
import { RestaurantNotFoundError } from './errors/restaurant-not-found.error.js';
import { UpdateRestaurantUseCase } from './update-restaurant.use-case.js';

const kairu: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: '48991242935',
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

const data: RestaurantData = {
  name: 'Kairú Vegano',
  description: 'Cozinha autoral',
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: 'kairu.veg',
  openingHours: {
    monday: [],
    tuesday: [{ opens: '19:00', closes: '23:00' }],
    wednesday: [{ opens: '19:00', closes: '23:00' }],
    thursday: [{ opens: '19:00', closes: '23:00' }],
    friday: [{ opens: '19:00', closes: '23:00' }],
    saturday: [{ opens: '19:00', closes: '23:00' }],
    sunday: [{ opens: '19:00', closes: '23:00' }],
  },
};

describe('UpdateRestaurantUseCase', () => {
  it('replaces the restaurant data and returns it', async () => {
    const repository = new InMemoryRestaurantRepository([kairu]);
    const useCase = new UpdateRestaurantUseCase(repository);

    const restaurant = await useCase.execute(kairu.id, data);

    expect(restaurant).toMatchObject({ ...data, id: kairu.id });
    expect(await repository.findById(kairu.id)).toEqual(restaurant);
  });

  it('stores the neighborhood capitalized', async () => {
    const repository = new InMemoryRestaurantRepository([kairu]);
    const useCase = new UpdateRestaurantUseCase(repository);

    const restaurant = await useCase.execute(kairu.id, {
      ...data,
      neighborhood: 'RIO TAVARES',
    });

    expect(restaurant.neighborhood).toBe('Rio Tavares');
    expect((await repository.findById(kairu.id))?.neighborhood).toBe(
      'Rio Tavares',
    );
  });

  it('throws RestaurantNotFoundError for an unknown id', async () => {
    const useCase = new UpdateRestaurantUseCase(
      new InMemoryRestaurantRepository([kairu]),
    );

    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000', data),
    ).rejects.toBeInstanceOf(RestaurantNotFoundError);
  });
});
