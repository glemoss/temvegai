import type { Knex } from 'knex';
import type { Neighborhood } from '../../entities/neighborhood.js';
import type { Restaurant, RestaurantType } from '../../entities/restaurant.js';
import type {
  RestaurantData,
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

// Aggregates of numeric columns also come back as strings.
interface NeighborhoodRow {
  name: string;
  min_lat: string;
  max_lat: string;
  min_lng: string;
  max_lng: string;
}

type RestaurantDataRow = Omit<
  RestaurantRow,
  'id' | 'created_at' | 'updated_at'
>;

function toRestaurantDataRow(data: RestaurantData): RestaurantDataRow {
  return {
    name: data.name,
    description: data.description,
    type: data.type,
    address: data.address,
    neighborhood: data.neighborhood,
    latitude: String(data.latitude),
    longitude: String(data.longitude),
    phone: data.phone,
    website: data.website,
    instagram: data.instagram,
    opening_hours: data.openingHours,
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

  async findNeighborhoods(): Promise<Neighborhood[]> {
    const rows = await this.db('restaurants')
      .select<NeighborhoodRow[]>(
        this.db.raw('min(neighborhood) as name'),
        this.db.raw('min(latitude) as min_lat'),
        this.db.raw('max(latitude) as max_lat'),
        this.db.raw('min(longitude) as min_lng'),
        this.db.raw('max(longitude) as max_lng'),
      )
      .groupByRaw('lower(neighborhood)')
      .orderBy('name');

    return rows.map((row) => ({
      name: row.name,
      bounds: {
        minLat: Number(row.min_lat),
        maxLat: Number(row.max_lat),
        minLng: Number(row.min_lng),
        maxLng: Number(row.max_lng),
      },
    }));
  }

  async create(data: RestaurantData): Promise<Restaurant> {
    const [row] = await this.db<RestaurantRow>('restaurants')
      .insert(toRestaurantDataRow(data))
      .returning('*');
    return toRestaurant(row as RestaurantRow);
  }

  async update(id: string, data: RestaurantData): Promise<Restaurant | null> {
    const [row] = await this.db<RestaurantRow>('restaurants')
      .where({ id })
      .update({ ...toRestaurantDataRow(data), updated_at: this.db.fn.now() })
      .returning('*');
    return row ? toRestaurant(row as RestaurantRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db<RestaurantRow>('restaurants')
      .where({ id })
      .delete();
    return deleted > 0;
  }
}
