// Finds the coordinates of an address with Nominatim, the search of
// OpenStreetMap. Its usage policy allows at most one request per second
// and no search as you type, so callers wait for the typing to stop.
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Where an address is, and its neighborhood as OpenStreetMap names it:
// the official division of the city, such as "Trindade Sul".
export interface GeocodedAddress extends Coordinates {
  neighborhood: string | null;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Florianópolis, island and mainland, as west,north,east,south; results
// outside it are left out.
const FLORIANOPOLIS_VIEW_BOX = '-48.65,-27.37,-48.33,-27.86';

// The best match, or null when nothing matches.
export async function geocodeAddress(
  address: string,
  neighborhood: string,
  signal?: AbortSignal,
): Promise<GeocodedAddress | null> {
  const query = [address, neighborhood, 'Florianópolis']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'br',
    viewbox: FLORIANOPOLIS_VIEW_BOX,
    bounded: '1',
    addressdetails: '1',
    'accept-language': 'pt-BR',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error(`Nominatim respondeu ${response.status}`);
  }

  const results = (await response.json()) as {
    lat: string;
    lon: string;
    address?: { suburb?: string };
  }[];
  const [first] = results;
  return first
    ? {
        latitude: Number(first.lat),
        longitude: Number(first.lon),
        neighborhood: first.address?.suburb ?? null,
      }
    : null;
}

// What OpenStreetMap knows of the place at a point. The house number is
// rare: it only comes when the building is mapped with one.
export interface PlaceDescription {
  road: string | null;
  houseNumber: string | null;
  neighborhood: string | null;
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

// The street, number and neighborhood at a point, or null when the point
// has no address, as in the sea.
export async function reverseGeocode(
  { latitude, longitude }: Coordinates,
  signal?: AbortSignal,
): Promise<PlaceDescription | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    // The level of buildings, so the number comes when it is known.
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'pt-BR',
  });
  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Nominatim respondeu ${response.status}`);
  }

  const body = (await response.json()) as {
    address?: { road?: string; house_number?: string; suburb?: string };
  };
  if (!body.address) return null;
  return {
    road: body.address.road ?? null,
    houseNumber: body.address.house_number ?? null,
    neighborhood: body.address.suburb ?? null,
  };
}
