import { randomUUID } from 'node:crypto';
import type { Neighborhood } from '../../entities/neighborhood.js';
import type { Restaurant } from '../../entities/restaurant.js';
import type {
  RestaurantData,
  RestaurantFilters,
  RestaurantRepository,
} from '../restaurant.repository.js';

// Mirrors the Knex repository: lower() for neighborhood, unaccent + ilike for name.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export class InMemoryRestaurantRepository implements RestaurantRepository {
  private readonly restaurants: Restaurant[];

  // Copies the list so writes do not change the caller's array.
  constructor(restaurants: Restaurant[] = []) {
    this.restaurants = [...restaurants];
  }

  async findAll({
    type,
    neighborhood,
    name,
    bounds,
  }: RestaurantFilters): Promise<Restaurant[]> {
    return this.restaurants
      .filter((restaurant) => !type || restaurant.type === type)
      .filter(
        (restaurant) =>
          !neighborhood ||
          restaurant.neighborhood.toLowerCase() === neighborhood.toLowerCase(),
      )
      .filter(
        (restaurant) =>
          !name || normalize(restaurant.name).includes(normalize(name)),
      )
      .filter(
        (restaurant) =>
          !bounds ||
          (restaurant.latitude >= bounds.minLat &&
            restaurant.latitude <= bounds.maxLat &&
            restaurant.longitude >= bounds.minLng &&
            restaurant.longitude <= bounds.maxLng),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find((restaurant) => restaurant.id === id) ?? null;
  }

  // Mirrors the Knex repository: groups by lower(neighborhood) and keeps the
  // smallest spelling as the name, like min().
  async findNeighborhoods(): Promise<Neighborhood[]> {
    const groups = new Map<string, Neighborhood>();

    for (const { neighborhood, latitude, longitude } of this.restaurants) {
      const key = neighborhood.toLowerCase();
      const group = groups.get(key);

      if (!group) {
        groups.set(key, {
          name: neighborhood,
          bounds: {
            minLat: latitude,
            maxLat: latitude,
            minLng: longitude,
            maxLng: longitude,
          },
        });
        continue;
      }

      if (neighborhood < group.name) {
        group.name = neighborhood;
      }
      group.bounds.minLat = Math.min(group.bounds.minLat, latitude);
      group.bounds.maxLat = Math.max(group.bounds.maxLat, latitude);
      group.bounds.minLng = Math.min(group.bounds.minLng, longitude);
      group.bounds.maxLng = Math.max(group.bounds.maxLng, longitude);
    }

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(data: RestaurantData): Promise<Restaurant> {
    const now = new Date();
    const restaurant: Restaurant = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.restaurants.push(restaurant);
    return restaurant;
  }

  async update(id: string, data: RestaurantData): Promise<Restaurant | null> {
    const index = this.restaurants.findIndex(
      (restaurant) => restaurant.id === id,
    );
    const current = this.restaurants[index];
    if (!current) {
      return null;
    }

    const restaurant: Restaurant = {
      ...data,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };
    this.restaurants[index] = restaurant;
    return restaurant;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.restaurants.findIndex(
      (restaurant) => restaurant.id === id,
    );
    if (index === -1) {
      return false;
    }

    this.restaurants.splice(index, 1);
    return true;
  }
}
