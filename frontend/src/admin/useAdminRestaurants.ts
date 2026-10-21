import { useCallback, useEffect, useState } from 'react';
import { fetchRestaurants, type Restaurant } from '../api/restaurants';

export type AdminRestaurantsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; restaurants: Restaurant[] };

// Every restaurant of the API, without filters; the panel searches the list
// by itself. `reload` requests the list again, keeping the current one on
// screen until the new one arrives.
export function useAdminRestaurants(): [AdminRestaurantsState, () => void] {
  const [state, setState] = useState<AdminRestaurantsState>({
    status: 'loading',
  });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

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
  }, [version]);

  return [state, reload];
}
