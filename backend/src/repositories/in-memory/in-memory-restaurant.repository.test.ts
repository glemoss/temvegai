import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../../entities/restaurant.js';
import type { RestaurantData } from '../restaurant.repository.js';
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

const data: RestaurantData = {
  name: 'Novo Veg',
  description: 'Comida caseira',
  type: 'vegan_options',
  address: 'Rua Nova, 2',
  neighborhood: 'Trindade',
  latitude: -27.5865,
  longitude: -48.5226,
  phone: '4833334444',
  website: 'https://novoveg.com',
  instagram: 'novoveg',
  openingHours: {
    monday: [{ opens: '11:00', closes: '15:00' }],
    tuesday: [{ opens: '11:00', closes: '15:00' }],
    wednesday: [{ opens: '11:00', closes: '15:00' }],
    thursday: [{ opens: '11:00', closes: '15:00' }],
    friday: [{ opens: '11:00', closes: '15:00' }],
    saturday: [],
    sunday: [],
  },
};

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

  it('orders names ignoring accents and case', async () => {
    const names = ['naTerra', 'Zen Veg', 'Éden Veg', 'BUGIO', 'Bistrô'];
    const repository = new InMemoryRestaurantRepository(
      names.map((name, index) =>
        makeRestaurant({
          id: `00000000-0000-0000-0000-00000000000${index}`,
          name,
        }),
      ),
    );

    const restaurants = await repository.findAll({});

    expect(restaurants.map(({ name }) => name)).toEqual([
      'Bistrô',
      'BUGIO',
      'Éden Veg',
      'naTerra',
      'Zen Veg',
    ]);
  });

  it('keeps an accented first letter within the limit', async () => {
    const names = ['Horta Veg', 'Ilha Veg', 'Éden Veg', 'Folha Veg'];
    const repository = new InMemoryRestaurantRepository(
      names.map((name, index) =>
        makeRestaurant({
          id: `00000000-0000-0000-0000-00000000000${index}`,
          name,
        }),
      ),
    );

    const restaurants = await repository.findAll({ limit: 2 });

    expect(restaurants.map(({ name }) => name)).toEqual([
      'Éden Veg',
      'Folha Veg',
    ]);
  });

  it('orders neighborhoods ignoring accents', async () => {
    const neighborhoods = ['Trindade', 'Água Verde', 'Centro'];
    const repository = new InMemoryRestaurantRepository(
      neighborhoods.map((neighborhood, index) =>
        makeRestaurant({
          id: `00000000-0000-0000-0000-00000000000${index}`,
          neighborhood,
        }),
      ),
    );

    const result = await repository.findNeighborhoods();

    expect(result.map(({ name }) => name)).toEqual([
      'Água Verde',
      'Centro',
      'Trindade',
    ]);
  });

  it('finds a restaurant by id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe, kairu]);

    expect(await repository.findById('3')).toEqual(kairu);
  });

  it('returns null for an unknown id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe]);

    expect(await repository.findById('999')).toBeNull();
  });

  it('creates a restaurant with a new id and timestamps', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe]);

    const created = await repository.create(data);

    expect(created).toEqual({
      ...data,
      id: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: created.createdAt,
    });
    expect(created.id).not.toBe(tsanThe.id);
    expect(await repository.findById(created.id)).toEqual(created);
  });

  it('updates a restaurant keeping its id and createdAt', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe, kairu]);

    const updated = await repository.update('3', data);

    expect(updated).toEqual({
      ...data,
      id: '3',
      createdAt: kairu.createdAt,
      updatedAt: expect.any(Date),
    });
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(
      kairu.updatedAt.getTime(),
    );
    expect(await repository.findById('3')).toEqual(updated);
    expect(await repository.findById('1')).toEqual(tsanThe);
  });

  it('returns null when updating an unknown id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe]);

    expect(await repository.update('999', data)).toBeNull();
    expect(await repository.findAll({})).toEqual([tsanThe]);
  });

  it('deletes a restaurant', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe, kairu]);

    expect(await repository.delete('3')).toBe(true);
    expect(await repository.findAll({})).toEqual([tsanThe]);
  });

  it('returns false when deleting an unknown id', async () => {
    const repository = new InMemoryRestaurantRepository([tsanThe]);

    expect(await repository.delete('999')).toBe(false);
    expect(await repository.findAll({})).toEqual([tsanThe]);
  });

  it('does not change the list it was given', async () => {
    const restaurants = [tsanThe];
    const repository = new InMemoryRestaurantRepository(restaurants);

    await repository.create(data);
    await repository.delete('1');

    expect(restaurants).toEqual([tsanThe]);
  });
});
