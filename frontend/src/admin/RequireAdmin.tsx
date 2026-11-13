import { Navigate } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { useCurrentAdmin } from './useCurrentAdmin';

// Checks the session when the panel opens, sends visitors without one to
// the login page and shows the panel to the admin.
export function RequireAdmin() {
  const state = useCurrentAdmin();

  if (state.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  if (state.status === 'authenticated') {
    return <AdminLayout admin={state.admin} />;
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-secondary px-4 py-6">
      <p
        role="status"
        className={
          state.status === 'error'
            ? 'font-semibold text-destructive'
            : undefined
        }
      >
        {state.status === 'loading'
          ? 'Verificando sessão…'
          : 'Não foi possível verificar a sessão. Tente novamente mais tarde.'}
      </p>
    </main>
  );
}
