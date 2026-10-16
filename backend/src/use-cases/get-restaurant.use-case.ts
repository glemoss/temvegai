import type { Restaurant } from '../entities/restaurant.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';
import { RestaurantNotFoundError } from './errors/restaurant-not-found.error.js';

export class GetRestaurantUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findById(id);

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    return restaurant;
  }
}
