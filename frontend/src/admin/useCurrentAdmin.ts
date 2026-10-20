import { useEffect, useState } from 'react';
import { fetchCurrentAdmin, type Admin } from '../api/auth';

export type CurrentAdminState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; admin: Admin };

export function useCurrentAdmin(): CurrentAdminState {
  const [state, setState] = useState<CurrentAdminState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetchCurrentAdmin(controller.signal).then(
      (admin) =>
        setState(
          admin
            ? { status: 'authenticated', admin }
            : { status: 'unauthenticated' },
        ),
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
