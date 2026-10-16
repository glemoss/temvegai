import type { Knex } from 'knex';
import type { Restaurant, RestaurantType } from '../../entities/restaurant.js';
import type {
  RestaurantFilters,
  RestaurantRepository,
} from '../restaurant.repository.js';

export interface RestaurantRow {
  id: string;
  name: string;
  description: string | null;
  type: RestaurantType;
  address: string;
  neighborhood: string;
  // The pg driver returns numeric columns as strings.
  latitude: string;
  longitude: string;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  opening_hours: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    address: row.address,
    neighborhood: row.neighborhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    openingHours: row.opening_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Makes % and _ match literally instead of acting as LIKE wildcards.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export class KnexRestaurantRepository implements RestaurantRepository {
  constructor(private readonly db: Knex) {}

  async findAll({
    type,
    neighborhood,
    name,
    bounds,
  }: RestaurantFilters): Promise<Restaurant[]> {
    const query = this.db<RestaurantRow>('restaurants').orderBy('name');

    if (type) {
      query.where({ type });
    }
    if (neighborhood) {
      query.whereRaw('lower(neighborhood) = lower(?)', [neighborhood]);
    }
    if (name) {
      query.whereRaw('unaccent(name) ilike unaccent(?)', [
        `%${escapeLike(name)}%`,
      ]);
    }
    if (bounds) {
      query
        .whereBetween('latitude', [bounds.minLat, bounds.maxLat])
        .whereBetween('longitude', [bounds.minLng, bounds.maxLng]);
    }

    const rows = await query;
    return rows.map(toRestaurant);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const row = await this.db<RestaurantRow>('restaurants')
      .where({ id })
      .first();
    return row ? toRestaurant(row) : null;
  }
}
