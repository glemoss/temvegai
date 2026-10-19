import type { RestaurantRepository } from '../repositories/restaurant.repository.js';
import { RestaurantNotFoundError } from './errors/restaurant-not-found.error.js';

export class DeleteRestaurantUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.restaurantRepository.delete(id);

    if (!deleted) {
      throw new RestaurantNotFoundError();
    }
  }
}
