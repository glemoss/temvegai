import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRestaurants, type Restaurant } from './restaurants';

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
