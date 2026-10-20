import type { Neighborhood } from '../entities/neighborhood.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';

export class ListNeighborhoodsUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(): Promise<Neighborhood[]> {
    return this.restaurantRepository.findNeighborhoods();
  }
}
