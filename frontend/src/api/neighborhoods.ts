import { config } from '../config';
import type { MapBounds } from './restaurants';

// A neighborhood with the smallest area that covers all its restaurants.
export interface Neighborhood {
  name: string;
  bounds: MapBounds;
}

export async function fetchNeighborhoods(
  signal?: AbortSignal,
): Promise<Neighborhood[]> {
  const response = await fetch(`${config.apiUrl}/neighborhoods`, { signal });

  if (!response.ok) {
    throw new Error(`GET /neighborhoods respondeu ${response.status}`);
  }

  const body = (await response.json()) as { neighborhoods: Neighborhood[] };
  return body.neighborhoods;
}
