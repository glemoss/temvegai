import { useEffect, useState } from 'react';
import { fetchRestaurants, type Restaurant } from './api/restaurants';

// Asked of the API with `limit`, so only these restaurants are sent.
export const MAX_SUGGESTIONS = 8;

export type RestaurantSuggestionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; restaurants: Restaurant[] };

// Restaurants from the whole city whose name matches `name`, ignoring the
// map area and the other filters. Nothing is requested for an empty name.
export function useRestaurantSuggestions(
  name: string,
): RestaurantSuggestionsState {
  const [state, setState] = useState<RestaurantSuggestionsState>({
    status: 'loading',
  });
  const trimmed = name.trim();

  useEffect(() => {
    if (!trimmed) {
      return;
    }

    // Aborts the request when the name changes, so a late response never
    // replaces a newer one. The previous suggestions are kept until the
    // new ones arrive, so the list does not blink on every key.
    const controller = new AbortController();

    fetchRestaurants(
      { name: trimmed, limit: MAX_SUGGESTIONS },
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
  }, [trimmed]);

  return trimmed ? state : { status: 'idle' };
}
