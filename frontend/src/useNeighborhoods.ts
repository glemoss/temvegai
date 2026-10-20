import { useEffect, useState } from 'react';
import { fetchNeighborhoods, type Neighborhood } from './api/neighborhoods';

export type NeighborhoodsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; neighborhoods: Neighborhood[] };

export function useNeighborhoods(): NeighborhoodsState {
  const [state, setState] = useState<NeighborhoodsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetchNeighborhoods(controller.signal).then(
      (neighborhoods) => setState({ status: 'success', neighborhoods }),
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
