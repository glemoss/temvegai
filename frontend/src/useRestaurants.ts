import { useEffect, useState } from 'react';
import { fetchRestaurants, type Restaurant } from './api/restaurants';

export type RestaurantsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; restaurants: Restaurant[] };

export function useRestaurants(): RestaurantsState {
  const [state, setState] = useState<RestaurantsState>({ status: 'loading' });

  useEffect(() => {
    // Aborts the request when the component unmounts, so a late response
    // does not update a component that is gone.
    const controller = new AbortController();

    fetchRestaurants(controller.signal).then(
      (restaurants) => setState({ status: 'success', restaurants }),
      () => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' });
        }
      },
    );

    return () => controller.abort();
  }, []);

  return state;
}
