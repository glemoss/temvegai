import { randomUUID } from 'node:crypto';
import type { Neighborhood } from '../../entities/neighborhood.js';
import type { Restaurant } from '../../entities/restaurant.js';
import type {
  RestaurantData,
  RestaurantFilters,
  RestaurantRepository,
} from '../restaurant.repository.js';

// Mirrors the Knex repository: lower() + unaccent for neighborhood, unaccent +
// ilike for name.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

// Mirrors the Knex repository: by the name without accents and case, then by
// the name itself, comparing code points like the "C" collation.
function compareNames(a: string, b: string): number {
  const [aKey, bKey] = [normalize(a), normalize(b)];
  if (aKey !== bKey) {
    return aKey < bKey ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

function hasAccents(value: string): boolean {
  return /\p{Diacritic}/u.test(value.normalize('NFD'));
}

// Mirrors the Knex repository: the most used spelling; on a tie, one with
// accents, then the smallest.
function compareSpellings(
  [a, aUses]: [string, number],
  [b, bUses]: [string, number],
): number {
  return (
    bUses - aUses ||
    Number(hasAccents(b)) - Number(hasAccents(a)) ||
    (a < b ? -1 : 1)
  );
}

interface NeighborhoodGroup {
  neighborhood: Neighborhood;
  // How many restaurants use each spelling.
  spellings: Map<string, number>;
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
    limit,
  }: RestaurantFilters): Promise<Restaurant[]> {
    return this.restaurants
      .filter((restaurant) => !type || restaurant.type === type)
      .filter(
        (restaurant) =>
          !neighborhood ||
          normalize(restaurant.neighborhood) === normalize(neighborhood),
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
      .sort((a, b) => compareNames(a.name, b.name))
      .slice(0, limit);
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find((restaurant) => restaurant.id === id) ?? null;
  }

  // Mirrors the Knex repository: groups by lower(unaccent(neighborhood)).
  async findNeighborhoods(): Promise<Neighborhood[]> {
    const groups = new Map<string, NeighborhoodGroup>();

    for (const { neighborhood, latitude, longitude } of this.restaurants) {
      const key = normalize(neighborhood);
      const group = groups.get(key);

      if (!group) {
        groups.set(key, {
          neighborhood: {
            name: neighborhood,
            bounds: {
              minLat: latitude,
              maxLat: latitude,
              minLng: longitude,
              maxLng: longitude,
            },
          },
          spellings: new Map([[neighborhood, 1]]),
        });
        continue;
      }

      const { bounds } = group.neighborhood;
      group.spellings.set(
        neighborhood,
        (group.spellings.get(neighborhood) ?? 0) + 1,
      );
      bounds.minLat = Math.min(bounds.minLat, latitude);
      bounds.maxLat = Math.max(bounds.maxLat, latitude);
      bounds.minLng = Math.min(bounds.minLng, longitude);
      bounds.maxLng = Math.max(bounds.maxLng, longitude);
    }

    return [...groups.values()]
      .map(({ neighborhood, spellings }) => {
        const [name] = [...spellings].reduce((best, spelling) =>
          compareSpellings(spelling, best) < 0 ? spelling : best,
        );
        return { ...neighborhood, name };
      })
      .sort((a, b) => compareNames(a.name, b.name));
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
