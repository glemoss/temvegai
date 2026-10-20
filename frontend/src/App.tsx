import { useCallback, useState } from 'react';
import type { MapBounds, Restaurant, RestaurantType } from './api/restaurants';
import { LeafIcon } from './leaf';
import { MapLegend } from './MapLegend';
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
  // The restaurant itself, not its id, so the panel stays open when the
  // restaurant leaves the results, for example after dragging the map.
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const debouncedName = useDebouncedValue(name, NAME_SEARCH_DELAY_MS);
  const state = useRestaurants({
    type,
    neighborhood,
    name: debouncedName,
    bounds,
  });
  const neighborhoodsState = useNeighborhoods();

  const restaurants = state.status === 'success' ? state.restaurants : [];
  const neighborhoods =
    neighborhoodsState.status === 'success'
      ? neighborhoodsState.neighborhoods
      : null;
  const focusBounds = neighborhoods?.find(
    ({ name }) => name === neighborhood,
  )?.bounds;
  const hasFilters = Boolean(type || neighborhood || name.trim());

  const closeDetails = useCallback(() => setSelected(null), []);

  function clearFilters() {
    setType(undefined);
    setNeighborhood(undefined);
    setName('');
  }

  return (
    <main>
      <div className="app-top">
        <header className="app-header">
          <h1 className="app-title">
            <LeafIcon type="fully_vegan" className="app-title-leaf" />
            Tem Veg Aí?
          </h1>
          <RestaurantFilters
            type={type}
            neighborhood={neighborhood}
            name={name}
            neighborhoods={neighborhoods}
            onTypeChange={setType}
            onNeighborhoodChange={setNeighborhood}
            onNameChange={setName}
          />
        </header>
        {/* Always present, so screen readers announce the messages that
          appear inside it. */}
        <div className="map-status" role="status">
          {state.status === 'loading' && (
            <p className="map-status-message">Carregando restaurantes…</p>
          )}
          {state.status === 'error' && (
            <p className="map-status-message map-status-error">
              Não foi possível carregar os restaurantes.
            </p>
          )}
          {state.status === 'success' && restaurants.length === 0 && (
            <p className="map-status-message">
              {hasFilters
                ? 'Nenhum restaurante nesta área com esses filtros.'
                : 'Nenhum restaurante nesta área. Afaste o mapa para ver mais.'}
              {hasFilters && (
                <button
                  type="button"
                  className="map-status-action"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
              )}
            </p>
          )}
        </div>
      </div>
      <MapLegend />
      <RestaurantMap
        restaurants={restaurants}
        focusBounds={focusBounds}
        onSelect={setSelected}
        onBoundsChange={setBounds}
      />
      {selected && (
        <RestaurantDetails
          // A new key per restaurant resets the panel, so switching
          // restaurants starts with the content scrolled to the top.
          key={selected.id}
          restaurant={selected}
          onClose={closeDetails}
        />
      )}
    </main>
  );
}
