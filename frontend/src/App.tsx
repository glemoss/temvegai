import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MapBounds, Restaurant, RestaurantType } from './api/restaurants';
import { AppTitle } from './AppTitle';
import { MapLegend } from './MapLegend';
import { RestaurantDetails } from './RestaurantDetails';
import { RestaurantFilters } from './RestaurantFilters';
import { RestaurantMap } from './RestaurantMap';
import { useNeighborhoods } from './useNeighborhoods';
import { useRestaurants } from './useRestaurants';

// The loading, error and empty messages, as a pill below the header.
const STATUS_MESSAGE =
  'm-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full bg-card px-4 py-2.5 text-center shadow-(--shadow)';

export function App() {
  const [type, setType] = useState<RestaurantType>();
  const [neighborhood, setNeighborhood] = useState<string>();
  // What is typed in the search field, and the name the map is filtered
  // by, which only changes on Enter or when the field is cleared.
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  // The restaurant itself, not its id, so the panel stays open when the
  // restaurant leaves the results, for example after dragging the map.
  const [selected, setSelected] = useState<Restaurant | null>(null);
  // The area of the restaurant chosen in the search, which the map moves
  // to. A new object on every choice, so choosing the same restaurant
  // again moves the map back to it.
  const [chosenBounds, setChosenBounds] = useState<MapBounds>();
  const headerRef = useRef<HTMLElement>(null);

  const state = useRestaurants({ type, neighborhood, name, bounds });
  const neighborhoodsState = useNeighborhoods();

  const restaurants = state.status === 'success' ? state.restaurants : [];
  const neighborhoods =
    neighborhoodsState.status === 'success'
      ? neighborhoodsState.neighborhoods
      : null;
  // Without a chosen restaurant, the map goes back to the neighborhood,
  // or to the initial view when there is none.
  const focusBounds =
    chosenBounds ??
    neighborhoods?.find(({ name }) => name === neighborhood)?.bounds;
  const hasFilters = Boolean(type || neighborhood || name.trim());

  const closeDetails = useCallback(() => setSelected(null), []);

  function clearFilters() {
    setType(undefined);
    setNeighborhood(undefined);
    setQuery('');
    setName('');
    setChosenBounds(undefined);
  }

  function changeNeighborhood(value: string | undefined) {
    setNeighborhood(value);
    setChosenBounds(undefined);
  }

  // Clearing the field also takes the map away from the chosen restaurant.
  function changeQuery(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setName('');
      setChosenBounds(undefined);
    }
  }

  // The field shows the chosen name, and an older name filter is removed so
  // the map is not filtered by something the field no longer says.
  function selectSuggestion(restaurant: Restaurant) {
    setQuery(restaurant.name);
    setName('');
    setSelected(restaurant);
    setChosenBounds({
      minLat: restaurant.latitude,
      maxLat: restaurant.latitude,
      minLng: restaurant.longitude,
      maxLng: restaurant.longitude,
    });
  }

  return (
    <main>
      {/* Top of the screen, centered: the header card and, below it, the
        loading, error and empty messages. Clicks around them reach the
        map. */}
      <div className="pointer-events-none absolute top-6 left-1/2 z-(--z-overlay) flex w-[26rem] max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-center gap-2 *:pointer-events-auto max-sm:top-4 max-sm:right-2 max-sm:left-2 max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0">
        <header
          ref={headerRef}
          className="w-full rounded-lg bg-card px-4 py-3 shadow-(--shadow) max-sm:px-3 max-sm:pt-2.5"
        >
          <AppTitle />
          <RestaurantFilters
            type={type}
            neighborhood={neighborhood}
            name={query}
            neighborhoods={neighborhoods}
            onTypeChange={setType}
            onNeighborhoodChange={changeNeighborhood}
            onNameChange={changeQuery}
            onNameSubmit={() => setName(query)}
            onRestaurantSelect={selectSuggestion}
          />
        </header>
        {/* Always present, so screen readers announce the messages that
          appear inside it. */}
        <div role="status">
          {state.status === 'loading' && (
            <p className={STATUS_MESSAGE}>Carregando restaurantes…</p>
          )}
          {state.status === 'error' && (
            <p className={cn(STATUS_MESSAGE, 'font-semibold text-destructive')}>
              Não foi possível carregar os restaurantes.
            </p>
          )}
          {state.status === 'success' && restaurants.length === 0 && (
            <p className={STATUS_MESSAGE}>
              {hasFilters
                ? 'Nenhum restaurante nesta área com esses filtros.'
                : 'Nenhum restaurante nesta área. Afaste o mapa para ver mais.'}
              {hasFilters && (
                <Button
                  type="button"
                  className="h-10 font-semibold"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </p>
          )}
        </div>
      </div>
      <MapLegend />
      <RestaurantMap
        restaurants={restaurants}
        focusBounds={focusBounds}
        focusIsSelected={chosenBounds !== undefined}
        selectedId={selected?.id}
        headerRef={headerRef}
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
