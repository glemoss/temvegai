import { config } from '../config';

export interface Restaurant {
  id: string;
  latitude: number;
  longitude: number;
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
