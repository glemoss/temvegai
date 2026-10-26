import { config } from '../config';

export type RestaurantType = 'fully_vegan' | 'vegan_options';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// Times are "HH:MM". A closing at or before the opening, as in
// 18:00–02:00, ends on the next day.
export interface TimeInterval {
  opens: string;
  closes: string;
}

// Every day of the week, in opening order; an empty list means closed.
export type WeeklyHours = Record<Weekday, TimeInterval[]>;

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
  openingHours: WeeklyHours | null;
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

// Everything a restaurant has but the id, which the API generates.
export type RestaurantInput = Omit<Restaurant, 'id'>;

export interface FieldError {
  field: string;
  message: string;
}

// The session expired or the admin logged out in another tab.
export class UnauthenticatedError extends Error {
  constructor() {
    super('Sessão expirada.');
    this.name = 'UnauthenticatedError';
  }
}

// The API refused the data; `details` says which field and why, with the
// field as a dotted path such as "openingHours.monday.0".
export class ValidationError extends Error {
  constructor(readonly details: FieldError[]) {
    super('Dados inválidos.');
    this.name = 'ValidationError';
  }
}

// The restaurant is not in the API, as when another admin removed it.
export class RestaurantNotFoundError extends Error {
  constructor() {
    super('Restaurante não encontrado.');
    this.name = 'RestaurantNotFoundError';
  }
}

// Null when there is no restaurant with this id, including an id that is
// not a UUID, which the API refuses with 400.
export async function fetchRestaurant(
  id: string,
  signal?: AbortSignal,
): Promise<Restaurant | null> {
  const response = await fetch(
    `${config.apiUrl}/restaurants/${encodeURIComponent(id)}`,
    { signal },
  );

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw new Error(`GET /restaurants/:id respondeu ${response.status}`);
  }

  const body = (await response.json()) as { restaurant: Restaurant };
  return body.restaurant;
}

// Sends the restaurant to a write route, which answers with it as saved.
async function sendRestaurant(
  method: 'POST' | 'PUT',
  path: string,
  input: RestaurantInput,
): Promise<Restaurant> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (response.status === 401) throw new UnauthenticatedError();
  if (response.status === 400) {
    const body = (await response.json()) as {
      error: { details?: FieldError[] };
    };
    throw new ValidationError(body.error.details ?? []);
  }
  if (response.status === 404) throw new RestaurantNotFoundError();
  if (!response.ok) {
    throw new Error(`${method} ${path} respondeu ${response.status}`);
  }

  const body = (await response.json()) as { restaurant: Restaurant };
  return body.restaurant;
}

export function createRestaurant(input: RestaurantInput): Promise<Restaurant> {
  return sendRestaurant('POST', '/restaurants', input);
}

export function updateRestaurant(
  id: string,
  input: RestaurantInput,
): Promise<Restaurant> {
  return sendRestaurant('PUT', `/restaurants/${encodeURIComponent(id)}`, input);
}

export async function deleteRestaurant(id: string): Promise<void> {
  const path = `/restaurants/${encodeURIComponent(id)}`;
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (response.status === 401) throw new UnauthenticatedError();
  if (response.status === 404) throw new RestaurantNotFoundError();
  if (!response.ok) {
    throw new Error(`DELETE ${path} respondeu ${response.status}`);
  }
}
