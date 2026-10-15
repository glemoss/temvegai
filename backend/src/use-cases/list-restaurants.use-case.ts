import type { Restaurant } from '../entities/restaurant.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';

export class ListRestaurantsUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(): Promise<Restaurant[]> {
    return this.restaurantRepository.findAll();
  }
}
