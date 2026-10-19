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
  phone: '(48) 99124-2935',
  website: null,
  instagram: 'kairu.veg',
  openingHours: 'Seg e qua a dom, 19h–23h; fecha ter',
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
  openingHours: 'Ter a dom, 19h–23h',
};

describe('UpdateRestaurantUseCase', () => {
  it('replaces the restaurant data and returns it', async () => {
    const repository = new InMemoryRestaurantRepository([kairu]);
    const useCase = new UpdateRestaurantUseCase(repository);

    const restaurant = await useCase.execute(kairu.id, data);

    expect(restaurant).toMatchObject({ ...data, id: kairu.id });
    expect(await repository.findById(kairu.id)).toEqual(restaurant);
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
