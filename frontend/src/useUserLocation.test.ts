// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserLocation } from './useUserLocation';

const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

// The callbacks of the last watchPosition call.
let succeed: (latitude: number, longitude: number, accuracy: number) => void;
let fail: (code: number) => void;

const watchPosition = vi.fn(
  (success: PositionCallback, error?: PositionErrorCallback | null) => {
    succeed = (latitude, longitude, accuracy) =>
      act(() =>
        success({
          coords: { latitude, longitude, accuracy },
        } as GeolocationPosition),
      );
    fail = (code) =>
      act(() =>
        error?.({ code, PERMISSION_DENIED } as GeolocationPositionError),
      );
    return 7;
  },
);
const clearWatch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } });
  watchPosition.mockClear();
  clearWatch.mockClear();
});

// Unmounted first, since unmounting stops watching the location.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useUserLocation', () => {
  it('does not ask for the location before locate is called', () => {
    const { result } = renderHook(() => useUserLocation());

    expect(result.current.state).toEqual({ status: 'idle' });
    expect(watchPosition).not.toHaveBeenCalled();
  });

  it('is locating until the browser finds the position', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());

    expect(result.current.state).toEqual({ status: 'locating' });
    expect(watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true },
    );
  });

  it('follows the position the browser reports', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    succeed(-27.6, -48.52, 25);
    succeed(-27.61, -48.53, 10);

    expect(result.current.state).toEqual({
      status: 'located',
      position: { latitude: -27.61, longitude: -48.53, accuracy: 10 },
    });
  });

  it('watches only once when locate is called again', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    act(() => result.current.locate());

    expect(watchPosition).toHaveBeenCalledOnce();
  });

  it('stops watching when the permission is denied, and asks again on the next call', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    fail(PERMISSION_DENIED);

    expect(result.current.state).toEqual({ status: 'denied' });
    expect(clearWatch).toHaveBeenCalledWith(7);

    act(() => result.current.locate());

    expect(watchPosition).toHaveBeenCalledTimes(2);
  });

  it('says the position is unavailable when none was found', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    fail(POSITION_UNAVAILABLE);

    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('keeps a position already found when the signal is lost', () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    succeed(-27.6, -48.52, 25);
    fail(POSITION_UNAVAILABLE);

    expect(result.current.state).toEqual({
      status: 'located',
      position: { latitude: -27.6, longitude: -48.52, accuracy: 25 },
    });
  });

  it('stops watching when unmounted', () => {
    const { result, unmount } = renderHook(() => useUserLocation());

    act(() => result.current.locate());
    unmount();

    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('says so when the browser has no geolocation', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useUserLocation());

    act(() => result.current.locate());

    expect(result.current.state).toEqual({ status: 'unsupported' });
  });
});
