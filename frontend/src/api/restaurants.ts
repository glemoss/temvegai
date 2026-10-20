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

function toSearchParams({
  type,
  neighborhood,
  name,
  bounds,
}: RestaurantFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (type) params.set('type', type);
  if (neighborhood) params.set('neighborhood', neighborhood);
  if (name?.trim()) params.set('q', name.trim());
  if (bounds) {
    params.set('minLat', String(bounds.minLat));
    params.set('maxLat', String(bounds.maxLat));
    params.set('minLng', String(bounds.minLng));
    params.set('maxLng', String(bounds.maxLng));
  }

  return params;
}

export async function fetchRestaurants(
  filters: RestaurantFilters = {},
  signal?: AbortSignal,
): Promise<Restaurant[]> {
  const query = toSearchParams(filters).toString();
  const url = `${config.apiUrl}/restaurants${query ? `?${query}` : ''}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`GET /restaurants respondeu ${response.status}`);
  }

  const body = (await response.json()) as { restaurants: Restaurant[] };
  return body.restaurants;
}
