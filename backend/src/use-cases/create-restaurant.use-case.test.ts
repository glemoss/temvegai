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
  openingHours: 'Seg e qua a dom, 19h–23h; fecha ter',
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
