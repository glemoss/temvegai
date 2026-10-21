import { afterEach, describe, expect, it, vi } from 'vitest';
import { geocodeAddress, reverseGeocode } from './geocoding';

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('geocodeAddress', () => {
  it('searches the address in Florianópolis only', async () => {
    const fetchMock = stubFetch(Response.json([]));
    const controller = new AbortController();

    await geocodeAddress(
      ' Rua das Flores, 100 ',
      'Campeche',
      controller.signal,
    );

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const params = new URL(String(url)).searchParams;
    expect(String(url)).toMatch(
      /^https:\/\/nominatim\.openstreetmap\.org\/search\?/,
    );
    expect(params.get('q')).toBe(
      'Rua das Flores, 100, Campeche, Florianópolis',
    );
    expect(params.get('limit')).toBe('1');
    expect(params.get('bounded')).toBe('1');
    expect(params.get('addressdetails')).toBe('1');
    expect(params.get('viewbox')).toBe('-48.65,-27.37,-48.33,-27.86');
    expect(init).toEqual({ signal: controller.signal });
  });

  it('leaves out an empty neighborhood', async () => {
    const fetchMock = stubFetch(Response.json([]));

    await geocodeAddress('Rua das Flores, 100', ' ');

    const params = new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams;
    expect(params.get('q')).toBe('Rua das Flores, 100, Florianópolis');
  });

  it('returns the coordinates and the neighborhood of the first result', async () => {
    stubFetch(
      Response.json([
        {
          lat: '-27.661458',
          lon: '-48.499222',
          address: { neighbourhood: 'Campeche Central', suburb: 'Campeche' },
        },
        { lat: '-27.5', lon: '-48.5' },
      ]),
    );

    await expect(geocodeAddress('Rua das Flores', '')).resolves.toEqual({
      latitude: -27.661458,
      longitude: -48.499222,
      neighborhood: 'Campeche',
    });
  });

  it('returns no neighborhood when the result has none', async () => {
    stubFetch(Response.json([{ lat: '-27.5', lon: '-48.5', address: {} }]));

    await expect(geocodeAddress('Rua das Flores', '')).resolves.toEqual({
      latitude: -27.5,
      longitude: -48.5,
      neighborhood: null,
    });
  });

  it('returns null when nothing matches', async () => {
    stubFetch(Response.json([]));

    await expect(geocodeAddress('Rua que não existe', '')).resolves.toBeNull();
  });

  it('throws when the service fails', async () => {
    stubFetch(Response.json({}, { status: 503 }));

    await expect(geocodeAddress('Rua das Flores', '')).rejects.toThrow(
      'Nominatim respondeu 503',
    );
  });
});

describe('reverseGeocode', () => {
  const point = { latitude: -27.6015392, longitude: -48.5171246 };

  it('asks for the address at the point, at the level of buildings', async () => {
    const fetchMock = stubFetch(Response.json({ address: {} }));
    const controller = new AbortController();

    await reverseGeocode(point, controller.signal);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const params = new URL(String(url)).searchParams;
    expect(String(url)).toMatch(
      /^https:\/\/nominatim\.openstreetmap\.org\/reverse\?/,
    );
    expect(params.get('lat')).toBe('-27.6015392');
    expect(params.get('lon')).toBe('-48.5171246');
    expect(params.get('zoom')).toBe('18');
    expect(params.get('addressdetails')).toBe('1');
    expect(init).toEqual({ signal: controller.signal });
  });

  it('returns the street, number and neighborhood', async () => {
    stubFetch(
      Response.json({
        address: {
          house_number: '1740',
          road: 'Rua Deputado Antônio Edu Vieira',
          suburb: 'Pantanal',
          city: 'Florianópolis',
        },
      }),
    );

    await expect(reverseGeocode(point)).resolves.toEqual({
      road: 'Rua Deputado Antônio Edu Vieira',
      houseNumber: '1740',
      neighborhood: 'Pantanal',
    });
  });

  it('returns null for the parts it does not know', async () => {
    stubFetch(Response.json({ address: { road: 'Rua dos Tucunarés' } }));

    await expect(reverseGeocode(point)).resolves.toEqual({
      road: 'Rua dos Tucunarés',
      houseNumber: null,
      neighborhood: null,
    });
  });

  it('returns null for a point without an address', async () => {
    stubFetch(Response.json({ error: 'Unable to geocode' }));

    await expect(reverseGeocode(point)).resolves.toBeNull();
  });

  it('throws when the service fails', async () => {
    stubFetch(Response.json({}, { status: 503 }));

    await expect(reverseGeocode(point)).rejects.toThrow(
      'Nominatim respondeu 503',
    );
  });
});
