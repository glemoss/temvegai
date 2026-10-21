import { describe, expect, it } from 'vitest';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import type { RestaurantData } from '../repositories/restaurant.repository.js';
import { CreateRestaurantUseCase } from './create-restaurant.use-case.js';

const data: RestaurantData = {
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
};

describe('CreateRestaurantUseCase', () => {
  it('creates and returns the restaurant', async () => {
    const repository = new InMemoryRestaurantRepository();
    const useCase = new CreateRestaurantUseCase(repository);

    const restaurant = await useCase.execute(data);

    expect(restaurant).toMatchObject(data);
    expect(await repository.findById(restaurant.id)).toEqual(restaurant);
  });
});
