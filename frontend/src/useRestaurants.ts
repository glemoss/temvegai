import { useEffect, useState } from 'react';
import {
  fetchRestaurants,
  type MapBounds,
  type Restaurant,
  type RestaurantFilters,
} from './api/restaurants';

export type RestaurantsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; restaurants: Restaurant[] };

interface UseRestaurantsOptions extends Omit<RestaurantFilters, 'bounds'> {
  // The visible area of the map; `null` until the map reports it, so the
  // first request already asks only for what is on screen.
  bounds: MapBounds | null;
}

export function useRestaurants({
  type,
  neighborhood,
  name,
  bounds,
}: UseRestaurantsOptions): RestaurantsState {
  const [state, setState] = useState<RestaurantsState>({ status: 'loading' });

  useEffect(() => {
    if (!bounds) {
      return;
    }

    // Aborts the request when the filters change or the component
    // unmounts, so a late response never replaces a newer one. The
    // current state is kept until the new response arrives, so the
    // markers do not blink on every map move.
    const controller = new AbortController();

    fetchRestaurants(
      { type, neighborhood, name, bounds },
      controller.signal,
    ).then(
      (restaurants) => setState({ status: 'success', restaurants }),
      () => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' });
        }
      },
    );

    return () => controller.abort();
  }, [type, neighborhood, name, bounds]);

  return state;
}
