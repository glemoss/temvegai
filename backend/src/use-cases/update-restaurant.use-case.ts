import { formatNeighborhoodName } from '../entities/neighborhood.js';
import type { Restaurant } from '../entities/restaurant.js';
import type {
  RestaurantData,
  RestaurantRepository,
} from '../repositories/restaurant.repository.js';
import { RestaurantNotFoundError } from './errors/restaurant-not-found.error.js';

export class UpdateRestaurantUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(id: string, data: RestaurantData): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.update(id, {
      ...data,
      neighborhood: formatNeighborhoodName(data.neighborhood),
    });

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    return restaurant;
  }
}
