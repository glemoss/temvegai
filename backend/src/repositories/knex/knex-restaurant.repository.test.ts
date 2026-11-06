import { describe, expect, it } from 'vitest';
import type { WeeklyHours } from '../../entities/restaurant.js';
import {
  toRestaurant,
  type RestaurantRow,
} from './knex-restaurant.repository.js';

const createdAt = new Date('2026-10-14T12:00:00Z');
const updatedAt = new Date('2026-10-15T12:00:00Z');

const openingHours: WeeklyHours = {
  monday: [{ opens: '19:00', closes: '23:00' }],
  tuesday: [],
  wednesday: [{ opens: '19:00', closes: '23:00' }],
  thursday: [{ opens: '19:00', closes: '23:00' }],
  friday: [{ opens: '19:00', closes: '23:00' }],
  saturday: [{ opens: '19:00', closes: '23:00' }],
  sunday: [{ opens: '19:00', closes: '23:00' }],
};

const row: RestaurantRow = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: '-27.661458',
  longitude: '-48.499222',
  phone: '48991242935',
  website: null,
  instagram: 'kairu.veg',
  opening_hours: openingHours,
  created_at: createdAt,
  updated_at: updatedAt,
};

describe('toRestaurant', () => {
  it('maps the row to camelCase fields', () => {
    expect(toRestaurant(row)).toEqual({
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
      openingHours,
      createdAt,
      updatedAt,
    });
  });

  it('converts the numeric coordinates to numbers', () => {
    const restaurant = toRestaurant(row);

    expect(typeof restaurant.latitude).toBe('number');
    expect(typeof restaurant.longitude).toBe('number');
  });

  it('returns the opening hours from Monday to Sunday', () => {
    const { monday, ...fromTuesday } = openingHours;
    const restaurant = toRestaurant({
      ...row,
      opening_hours: { ...fromTuesday, monday },
    });

    expect(Object.keys(restaurant.openingHours ?? {})).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]);
    expect(restaurant.openingHours).toEqual(openingHours);
  });

  it('keeps optional fields as null', () => {
    const restaurant = toRestaurant({
      ...row,
      phone: null,
      instagram: null,
      opening_hours: null,
    });

    expect(restaurant.phone).toBeNull();
    expect(restaurant.instagram).toBeNull();
    expect(restaurant.openingHours).toBeNull();
  });
});
