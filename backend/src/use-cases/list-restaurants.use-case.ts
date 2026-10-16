import type { Restaurant } from '../entities/restaurant.js';
import type {
  RestaurantFilters,
  RestaurantRepository,
} from '../repositories/restaurant.repository.js';

export class ListRestaurantsUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(filters: RestaurantFilters = {}): Promise<Restaurant[]> {
    return this.restaurantRepository.findAll(filters);
  }
}
