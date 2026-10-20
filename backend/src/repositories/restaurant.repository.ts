import type { MapBounds, Neighborhood } from '../entities/neighborhood.js';
import type { Restaurant, RestaurantType } from '../entities/restaurant.js';

export interface RestaurantFilters {
  type?: RestaurantType;
  neighborhood?: string;
  name?: string;
  bounds?: MapBounds;
}

// The fields an admin writes; id and timestamps are set by the repository.
export type RestaurantData = Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>;

export interface RestaurantRepository {
  findAll(filters: RestaurantFilters): Promise<Restaurant[]>;
  findById(id: string): Promise<Restaurant | null>;
  // Groups neighborhoods ignoring case, like the neighborhood filter, and
  // orders them by name.
  findNeighborhoods(): Promise<Neighborhood[]>;
  create(data: RestaurantData): Promise<Restaurant>;
  // Returns null when there is no restaurant with the given id.
  update(id: string, data: RestaurantData): Promise<Restaurant | null>;
  // Returns false when there is no restaurant with the given id.
  delete(id: string): Promise<boolean>;
}
