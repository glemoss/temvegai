import { useEffect, useState } from 'react';
import { fetchRestaurants, type Restaurant } from '../api/restaurants';

export type AdminRestaurantsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; restaurants: Restaurant[] };

// Every restaurant of the API, without filters; the panel searches the list
// by itself.
export function useAdminRestaurants(): AdminRestaurantsState {
  const [state, setState] = useState<AdminRestaurantsState>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchRestaurants({}, controller.signal).then(
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
