import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRestaurants } from './restaurants';

vi.mock('../config', () => ({ config: { apiUrl: 'http://api.test' } }));

const restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  latitude: -27.661458,
  longitude: -48.499222,
};

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
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

    await fetchRestaurants(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/restaurants', {
      signal: controller.signal,
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
