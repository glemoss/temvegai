import { RestaurantMap } from './RestaurantMap';
import { useRestaurants } from './useRestaurants';

export function App() {
  const state = useRestaurants();

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
      <RestaurantMap
        restaurants={state.status === 'success' ? state.restaurants : []}
      />
    </main>
  );
}
