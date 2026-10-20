import { config } from '../config';

export type RestaurantType = 'fully_vegan' | 'vegan_options';

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  type: RestaurantType;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  openingHours: string | null;
}

export async function fetchRestaurants(
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const response = await fetch(`${config.apiUrl}/restaurants`, { signal });

  if (!response.ok) {
    throw new Error(`GET /restaurants respondeu ${response.status}`);
  }

  const body = (await response.json()) as { restaurants: Restaurant[] };
  return body.restaurants;
}
