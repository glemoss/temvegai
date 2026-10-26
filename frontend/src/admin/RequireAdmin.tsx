import { Navigate, Outlet } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { AdminHeader } from './AdminHeader';
import { useCurrentAdmin } from './useCurrentAdmin';

// Layout of the panel pages: checks the session when the panel opens,
// sends visitors without one to the login page and puts the header on top
// of every page and the notices at the bottom.
export function RequireAdmin() {
  const state = useCurrentAdmin();

  if (state.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  if (state.status === 'authenticated') {
    return (
      <main className="min-h-full bg-secondary px-4 py-6">
        <AdminHeader admin={state.admin} />
        <Outlet />
        <Toaster closeButton />
      </main>
    );
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
