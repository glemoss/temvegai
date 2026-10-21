// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRestaurants, type Restaurant } from '../api/restaurants';
import { useAdminRestaurants } from './useAdminRestaurants';

vi.mock('../api/restaurants', () => ({ fetchRestaurants: vi.fn() }));

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

describe('useAdminRestaurants', () => {
  it('requests every restaurant, without filters', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValue([restaurant]);

    const { result } = renderHook(() => useAdminRestaurants());

    expect(result.current[0]).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current[0]).toEqual({
        status: 'success',
        restaurants: [restaurant],
      }),
    );
    expect(fetchRestaurants).toHaveBeenCalledWith({}, expect.any(AbortSignal));
  });

  it('aborts the request on unmount', () => {
    vi.mocked(fetchRestaurants).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useAdminRestaurants());

    unmount();

    expect(vi.mocked(fetchRestaurants).mock.calls[0]?.[1]?.aborted).toBe(true);
  });

  it('reports an error when the request fails', async () => {
    vi.mocked(fetchRestaurants).mockRejectedValue(new Error('500'));

    const { result } = renderHook(() => useAdminRestaurants());

    await waitFor(() => expect(result.current[0]).toEqual({ status: 'error' }));
  });

  it('requests the list again on reload, keeping the current one meanwhile', async () => {
    vi.mocked(fetchRestaurants).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAdminRestaurants());
    await waitFor(() =>
      expect(result.current[0]).toEqual({ status: 'success', restaurants: [] }),
    );

    vi.mocked(fetchRestaurants).mockResolvedValueOnce([restaurant]);
    act(() => result.current[1]());

    expect(result.current[0]).toEqual({ status: 'success', restaurants: [] });
    await waitFor(() =>
      expect(result.current[0]).toEqual({
        status: 'success',
        restaurants: [restaurant],
      }),
    );
    expect(fetchRestaurants).toHaveBeenCalledTimes(2);
  });
});
