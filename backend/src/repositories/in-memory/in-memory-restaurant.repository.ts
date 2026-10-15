import type { Restaurant } from '../../entities/restaurant.js';
import type { RestaurantRepository } from '../restaurant.repository.js';

export class InMemoryRestaurantRepository implements RestaurantRepository {
  constructor(private readonly restaurants: Restaurant[] = []) {}

  async findAll(): Promise<Restaurant[]> {
    return [...this.restaurants].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find((restaurant) => restaurant.id === id) ?? null;
  }
}
