import { formatNeighborhoodName } from '../entities/neighborhood.js';
import type { Restaurant } from '../entities/restaurant.js';
import type {
  RestaurantData,
  RestaurantRepository,
} from '../repositories/restaurant.repository.js';

export class CreateRestaurantUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(data: RestaurantData): Promise<Restaurant> {
    return this.restaurantRepository.create({
      ...data,
      neighborhood: formatNeighborhoodName(data.neighborhood),
    });
  }
}
