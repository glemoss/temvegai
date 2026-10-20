import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchNeighborhoods, type Neighborhood } from './neighborhoods';

vi.mock('../config', () => ({ config: { apiUrl: 'http://api.test' } }));

const neighborhood: Neighborhood = {
  name: 'Campeche',
  bounds: {
    minLat: -27.68,
    maxLat: -27.66,
    minLng: -48.5,
    maxLng: -48.48,
  },
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

describe('fetchNeighborhoods', () => {
  it('calls GET /neighborhoods on the API address', async () => {
    const fetchMock = stubFetch(Response.json({ neighborhoods: [] }));
    const controller = new AbortController();

    await fetchNeighborhoods(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/neighborhoods', {
      signal: controller.signal,
    });
  });

  it('returns the neighborhoods from the response', async () => {
    stubFetch(Response.json({ neighborhoods: [neighborhood] }));

    await expect(fetchNeighborhoods()).resolves.toEqual([neighborhood]);
  });

  it('fails when the API responds with an error status', async () => {
    stubFetch(Response.json({ error: {} }, { status: 500 }));

    await expect(fetchNeighborhoods()).rejects.toThrow('500');
  });

  it('fails when the API cannot be reached', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    await expect(fetchNeighborhoods()).rejects.toThrow('Failed to fetch');
  });
});
