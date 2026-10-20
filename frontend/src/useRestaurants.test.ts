// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRestaurants,
  type MapBounds,
  type Restaurant,
} from './api/restaurants';
import { useRestaurants } from './useRestaurants';

vi.mock('./api/restaurants', () => ({ fetchRestaurants: vi.fn() }));

const bounds: MapBounds = {
  minLat: -27.7,
  maxLat: -27.5,
  minLng: -48.6,
  maxLng: -48.4,
};

const restaurant: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Mandarina',
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

beforeEach(() => {
  vi.mocked(fetchRestaurants).mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useRestaurants', () => {
  it('waits for the map area before making a request', () => {
    const { result } = renderHook(() => useRestaurants({ bounds: null }));

    expect(result.current).toEqual({ status: 'loading' });
    expect(fetchRestaurants).not.toHaveBeenCalled();
  });

  it('requests the restaurants with the filters and the map area', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValue([restaurant]);

    const { result } = renderHook(() =>
      useRestaurants({
        type: 'fully_vegan',
        neighborhood: 'Campeche',
        name: 'mandarina',
        bounds,
      }),
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'success',
        restaurants: [restaurant],
      }),
    );
    expect(fetchRestaurants).toHaveBeenCalledWith(
      {
        type: 'fully_vegan',
        neighborhood: 'Campeche',
        name: 'mandarina',
        bounds,
      },
      expect.any(AbortSignal),
    );
  });

  it('keeps the previous restaurants while new ones load', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValueOnce([restaurant]);
    const { result, rerender } = renderHook(
      (props: { bounds: MapBounds }) => useRestaurants(props),
      { initialProps: { bounds } },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    vi.mocked(fetchRestaurants).mockReturnValueOnce(new Promise(() => {}));
    rerender({ bounds: { ...bounds, minLat: -27.6 } });

    expect(fetchRestaurants).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      status: 'success',
      restaurants: [restaurant],
    });
  });

  it('aborts the previous request when the filters change', () => {
    vi.mocked(fetchRestaurants).mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(
      (props: { name: string }) => useRestaurants({ ...props, bounds }),
      { initialProps: { name: 'man' } },
    );

    rerender({ name: 'mandarina' });

    const firstSignal = vi.mocked(fetchRestaurants).mock.calls[0]?.[1];
    const secondSignal = vi.mocked(fetchRestaurants).mock.calls[1]?.[1];
    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);
  });

  it('reports an error when the request fails', async () => {
    vi.mocked(fetchRestaurants).mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useRestaurants({ bounds }));

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });
});
