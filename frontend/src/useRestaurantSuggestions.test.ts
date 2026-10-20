// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRestaurants, type Restaurant } from './api/restaurants';
import {
  MAX_SUGGESTIONS,
  useRestaurantSuggestions,
} from './useRestaurantSuggestions';

vi.mock('./api/restaurants', () => ({ fetchRestaurants: vi.fn() }));

function restaurant(index: number): Restaurant {
  return {
    id: `restaurant-${index}`,
    name: `Restaurante ${index}`,
    description: null,
    type: 'fully_vegan',
    address: 'Rua das Flores, 100',
    neighborhood: 'Campeche',
    latitude: -27.661458,
    longitude: -48.499222,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  };
}

beforeEach(() => {
  vi.mocked(fetchRestaurants).mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useRestaurantSuggestions', () => {
  it('makes no request for an empty name', () => {
    const { result } = renderHook(() => useRestaurantSuggestions('  '));

    expect(result.current).toEqual({ status: 'idle' });
    expect(fetchRestaurants).not.toHaveBeenCalled();
  });

  it('requests the restaurants of the whole city by name only', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValue([restaurant(1)]);

    const { result } = renderHook(() => useRestaurantSuggestions(' rest '));

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'success',
        restaurants: [restaurant(1)],
      }),
    );
    expect(fetchRestaurants).toHaveBeenCalledWith(
      { name: 'rest' },
      expect.any(AbortSignal),
    );
  });

  it(`keeps at most ${MAX_SUGGESTIONS} suggestions`, async () => {
    const many = Array.from({ length: MAX_SUGGESTIONS + 2 }, (_, index) =>
      restaurant(index),
    );
    vi.mocked(fetchRestaurants).mockResolvedValue(many);

    const { result } = renderHook(() => useRestaurantSuggestions('rest'));

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'success',
        restaurants: many.slice(0, MAX_SUGGESTIONS),
      }),
    );
  });

  it('goes back to idle when the name is cleared', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValue([restaurant(1)]);
    const { result, rerender } = renderHook(
      (name: string) => useRestaurantSuggestions(name),
      { initialProps: 'rest' },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender('');

    expect(result.current).toEqual({ status: 'idle' });
    expect(fetchRestaurants).toHaveBeenCalledTimes(1);
  });

  it('aborts the previous request when the name changes', () => {
    vi.mocked(fetchRestaurants).mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(
      (name: string) => useRestaurantSuggestions(name),
      { initialProps: 'man' },
    );

    rerender('mandarina');

    const firstSignal = vi.mocked(fetchRestaurants).mock.calls[0]?.[1];
    const secondSignal = vi.mocked(fetchRestaurants).mock.calls[1]?.[1];
    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);
  });

  it('reports an error when the request fails', async () => {
    vi.mocked(fetchRestaurants).mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useRestaurantSuggestions('rest'));

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });
});
