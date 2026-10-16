import type { Restaurant, RestaurantType } from '../entities/restaurant.js';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface RestaurantFilters {
  type?: RestaurantType;
  neighborhood?: string;
  name?: string;
  bounds?: MapBounds;
}

export interface RestaurantRepository {
  findAll(filters: RestaurantFilters): Promise<Restaurant[]>;
  findById(id: string): Promise<Restaurant | null>;
}
