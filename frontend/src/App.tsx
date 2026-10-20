import { useState } from 'react';
import type { MapBounds, RestaurantType } from './api/restaurants';
import { RestaurantDetails } from './RestaurantDetails';
import { RestaurantFilters } from './RestaurantFilters';
import { RestaurantMap } from './RestaurantMap';
import { useDebouncedValue } from './useDebouncedValue';
import { useNeighborhoods } from './useNeighborhoods';
import { useRestaurants } from './useRestaurants';

// Waits for a pause in typing before searching, instead of one request
// per key.
const NAME_SEARCH_DELAY_MS = 300;

export function App() {
  const [type, setType] = useState<RestaurantType>();
  const [neighborhood, setNeighborhood] = useState<string>();
  const [name, setName] = useState('');
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedName = useDebouncedValue(name, NAME_SEARCH_DELAY_MS);
  const state = useRestaurants({
    type,
    neighborhood,
    name: debouncedName,
    bounds,
  });
  const neighborhoodsState = useNeighborhoods();

  const restaurants = state.status === 'success' ? state.restaurants : [];
  const selected = restaurants.find(({ id }) => id === selectedId);
  const neighborhoods =
    neighborhoodsState.status === 'success'
      ? neighborhoodsState.neighborhoods
      : null;
  const focusBounds = neighborhoods?.find(
    ({ name }) => name === neighborhood,
  )?.bounds;

  return (
    <main>
      <h1 className="app-title">Tem Veg Aí?</h1>
      <RestaurantFilters
        type={type}
        neighborhood={neighborhood}
        name={name}
        neighborhoods={neighborhoods}
        onTypeChange={setType}
        onNeighborhoodChange={setNeighborhood}
        onNameChange={setName}
      />
      {state.status === 'loading' && (
        <p className="map-status" role="status">
          Carregando restaurantes…
        </p>
      )}
      {state.status === 'error' && (
        <p className="map-status" role="alert">
          Não foi possível carregar os restaurantes.
        </p>
      )}
      <RestaurantMap
        restaurants={restaurants}
        focusBounds={focusBounds}
        onSelect={setSelectedId}
        onBoundsChange={setBounds}
      />
      {selected && (
        <RestaurantDetails
          // A new key per restaurant resets the panel, so switching
          // restaurants starts with the content scrolled to the top.
          key={selected.id}
          restaurant={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
