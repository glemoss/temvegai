import type { Restaurant } from '../../entities/restaurant.js';
import type {
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
  constructor(private readonly restaurants: Restaurant[] = []) {}

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
}
