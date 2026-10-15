import type { Restaurant } from '../entities/restaurant.js';

export interface RestaurantRepository {
  findAll(): Promise<Restaurant[]>;
  findById(id: string): Promise<Restaurant | null>;
}
