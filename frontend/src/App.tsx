import { useState } from 'react';
import { RestaurantDetails } from './RestaurantDetails';
import { RestaurantMap } from './RestaurantMap';
import { useRestaurants } from './useRestaurants';

export function App() {
  const state = useRestaurants();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const restaurants = state.status === 'success' ? state.restaurants : [];
  const selected = restaurants.find(({ id }) => id === selectedId);

  return (
    <main>
      <h1 className="app-title">Tem Veg Aí?</h1>
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
      <RestaurantMap restaurants={restaurants} onSelect={setSelectedId} />
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
