import { useCallback, useEffect, useRef, useState } from 'react';

// Where the visitor is, with how far off it may be, in meters.
export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type UserLocationState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; position: UserPosition }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'unsupported' };

// The visitor's location from the browser, which asks for permission on
// the first call to `locate`. It then follows the visitor while the page is
// open. The location never leaves the browser.
export function useUserLocation(): {
  state: UserLocationState;
  locate: () => void;
} {
  const [state, setState] = useState<UserLocationState>({ status: 'idle' });
  const watchId = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported' });
      return;
    }
    if (watchId.current !== null) return;

    setState({ status: 'locating' });
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setState({
          status: 'located',
          position: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          },
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          // Watching again on the next call asks the browser once more,
          // in case the visitor allowed it in the meantime.
          stopWatching();
          setState({ status: 'denied' });
          return;
        }
        // A position already found stays on the map through a lost signal.
        setState((current) =>
          current.status === 'located' ? current : { status: 'unavailable' },
        );
      },
      { enableHighAccuracy: true },
    );
  }, [stopWatching]);

  return { state, locate };
}
