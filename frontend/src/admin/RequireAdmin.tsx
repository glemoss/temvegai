import { Navigate, Outlet, useOutletContext } from 'react-router';
import type { Admin } from '../api/auth';
import { AdminHeader } from './AdminHeader';
import { useCurrentAdmin } from './useCurrentAdmin';

interface AdminSession {
  admin: Admin;
}

// Layout of the panel pages: checks the session when the panel opens,
// sends visitors without one to the login page and puts the header on top
// of every page.
export function RequireAdmin() {
  const state = useCurrentAdmin();

  if (state.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  if (state.status === 'authenticated') {
    return (
      <main className="admin-page">
        <AdminHeader admin={state.admin} />
        <Outlet context={{ admin: state.admin } satisfies AdminSession} />
      </main>
    );
  }

  return (
    <main className="admin-page admin-centered">
      <p
        role="status"
        className={state.status === 'error' ? 'admin-error' : undefined}
      >
        {state.status === 'loading'
          ? 'Verificando sessão…'
          : 'Não foi possível verificar a sessão. Tente novamente mais tarde.'}
      </p>
    </main>
  );
}

// The logged in admin, for the pages inside RequireAdmin.
export function useAdminSession(): AdminSession {
  return useOutletContext<AdminSession>();
}
