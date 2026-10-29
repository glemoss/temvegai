import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRestaurant,
  deleteRestaurant,
  fetchRestaurant,
  fetchRestaurants,
  RestaurantNotFoundError,
  UnauthenticatedError,
  updateRestaurant,
  ValidationError,
  type Restaurant,
  type RestaurantInput,
} from './restaurants';

vi.mock('../config', () => ({ config: { apiUrl: 'http://api.test' } }));

const restaurant: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Mandarina',
  description: null,
  type: 'fully_vegan',
  address: 'Rua das Flores, 100',
  neighborhood: 'Centro',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: 'mandarinafloripa',
  openingHours: null,
};

// The restaurant above, before the API gives it an id.
const input: RestaurantInput = {
  name: restaurant.name,
  description: restaurant.description,
  type: restaurant.type,
  address: restaurant.address,
  neighborhood: restaurant.neighborhood,
  latitude: restaurant.latitude,
  longitude: restaurant.longitude,
  phone: restaurant.phone,
  website: restaurant.website,
  instagram: restaurant.instagram,
  openingHours: restaurant.openingHours,
};

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchRestaurants', () => {
  it('calls GET /restaurants on the API address', async () => {
    const fetchMock = stubFetch(Response.json({ restaurants: [] }));
    const controller = new AbortController();

    await fetchRestaurants({}, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/restaurants', {
      signal: controller.signal,
    });
  });

  it('sends each filter as a query parameter', async () => {
    const fetchMock = stubFetch(Response.json({ restaurants: [] }));

    await fetchRestaurants({
      type: 'fully_vegan',
      neighborhood: 'Lagoa da Conceição',
      name: ' mandarina ',
      bounds: { minLat: -27.7, maxLat: -27.5, minLng: -48.6, maxLng: -48.4 },
      limit: 8,
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/restaurants');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      type: 'fully_vegan',
      neighborhood: 'Lagoa da Conceição',
      q: 'mandarina',
      minLat: '-27.7',
      maxLat: '-27.5',
      minLng: '-48.6',
      maxLng: '-48.4',
      limit: '8',
    });
  });

  it('leaves out empty filters', async () => {
    const fetchMock = stubFetch(Response.json({ restaurants: [] }));

    await fetchRestaurants({ neighborhood: '', name: '   ' });

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/restaurants', {
      signal: undefined,
    });
  });

  it('returns the restaurants from the response', async () => {
    stubFetch(Response.json({ restaurants: [restaurant] }));

    await expect(fetchRestaurants()).resolves.toEqual([restaurant]);
  });

  it('fails when the API responds with an error status', async () => {
    stubFetch(Response.json({ error: {} }, { status: 500 }));

    await expect(fetchRestaurants()).rejects.toThrow('500');
  });

  it('fails when the API cannot be reached', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    await expect(fetchRestaurants()).rejects.toThrow('Failed to fetch');
  });
});

describe('fetchRestaurant', () => {
  it('calls GET /restaurants/:id on the API address', async () => {
    const fetchMock = stubFetch(Response.json({ restaurant }));
    const controller = new AbortController();

    await fetchRestaurant(restaurant.id, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/restaurants/${restaurant.id}`,
      { signal: controller.signal },
    );
  });

  it('returns the restaurant from the response', async () => {
    stubFetch(Response.json({ restaurant }));

    await expect(fetchRestaurant(restaurant.id)).resolves.toEqual(restaurant);
  });

  it('returns null when the restaurant does not exist', async () => {
    stubFetch(
      Response.json(
        { error: { code: 'RESTAURANT_NOT_FOUND' } },
        { status: 404 },
      ),
    );

    await expect(fetchRestaurant(restaurant.id)).resolves.toBeNull();
  });

  it('returns null when the id is not a UUID', async () => {
    stubFetch(
      Response.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 }),
    );

    await expect(fetchRestaurant('abc')).resolves.toBeNull();
  });

  it('fails when the API responds with another error status', async () => {
    stubFetch(Response.json({ error: {} }, { status: 500 }));

    await expect(fetchRestaurant(restaurant.id)).rejects.toThrow('500');
  });
});

describe('createRestaurant', () => {
  it('posts the restaurant to /restaurants sending cookies', async () => {
    const fetchMock = stubFetch(Response.json({ restaurant }, { status: 201 }));

    await createRestaurant(input);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'include',
    });
  });

  it('returns the created restaurant', async () => {
    stubFetch(Response.json({ restaurant }, { status: 201 }));

    await expect(createRestaurant(input)).resolves.toEqual(restaurant);
  });

  it('throws UnauthenticatedError on 401', async () => {
    stubFetch(
      Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }),
    );

    await expect(createRestaurant(input)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('throws ValidationError with the details on 400', async () => {
    const details = [{ field: 'name', message: 'Too small' }];
    stubFetch(
      Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'x', details } },
        { status: 400 },
      ),
    );

    const error = await createRestaurant(input).catch((reason) => reason);

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(details);
  });

  it('throws a generic error on other failures', async () => {
    stubFetch(Response.json({}, { status: 500 }));

    await expect(createRestaurant(input)).rejects.toThrow(
      'POST /restaurants respondeu 500',
    );
  });
});

describe('updateRestaurant', () => {
  it('puts the restaurant to /restaurants/:id sending cookies', async () => {
    const fetchMock = stubFetch(Response.json({ restaurant }));

    await updateRestaurant(restaurant.id, input);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/restaurants/${restaurant.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'include',
      },
    );
  });

  it('returns the updated restaurant', async () => {
    stubFetch(Response.json({ restaurant }));

    await expect(updateRestaurant(restaurant.id, input)).resolves.toEqual(
      restaurant,
    );
  });

  it('throws UnauthenticatedError on 401', async () => {
    stubFetch(
      Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }),
    );

    await expect(updateRestaurant(restaurant.id, input)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('throws ValidationError with the details on 400', async () => {
    const details = [{ field: 'name', message: 'Too small' }];
    stubFetch(
      Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'x', details } },
        { status: 400 },
      ),
    );

    const error = await updateRestaurant(restaurant.id, input).catch(
      (reason) => reason,
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(details);
  });

  it('throws RestaurantNotFoundError on 404', async () => {
    stubFetch(
      Response.json(
        { error: { code: 'RESTAURANT_NOT_FOUND' } },
        { status: 404 },
      ),
    );

    await expect(updateRestaurant(restaurant.id, input)).rejects.toBeInstanceOf(
      RestaurantNotFoundError,
    );
  });

  it('throws a generic error on other failures', async () => {
    stubFetch(Response.json({}, { status: 500 }));

    await expect(updateRestaurant(restaurant.id, input)).rejects.toThrow(
      `PUT /restaurants/${restaurant.id} respondeu 500`,
    );
  });
});

describe('deleteRestaurant', () => {
  it('deletes /restaurants/:id sending cookies', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));

    await expect(deleteRestaurant(restaurant.id)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/restaurants/${restaurant.id}`,
      { method: 'DELETE', credentials: 'include' },
    );
  });

  it('throws UnauthenticatedError on 401', async () => {
    stubFetch(
      Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }),
    );

    await expect(deleteRestaurant(restaurant.id)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('throws RestaurantNotFoundError on 404', async () => {
    stubFetch(
      Response.json(
        { error: { code: 'RESTAURANT_NOT_FOUND' } },
        { status: 404 },
      ),
    );

    await expect(deleteRestaurant(restaurant.id)).rejects.toBeInstanceOf(
      RestaurantNotFoundError,
    );
  });

  it('throws a generic error on other failures', async () => {
    stubFetch(Response.json({}, { status: 500 }));

    await expect(deleteRestaurant(restaurant.id)).rejects.toThrow(
      `DELETE /restaurants/${restaurant.id} respondeu 500`,
    );
  });
});
