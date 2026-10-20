import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logout } from '../api/auth';
import { RestaurantList } from './RestaurantList';
import { useAdminSession } from './RequireAdmin';

export function AdminHome() {
  const { admin } = useAdminSession();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(false);

  async function exit() {
    setLoggingOut(true);
    setError(false);

    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch {
      setError(true);
      setLoggingOut(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Painel admin</h1>
        <p className="admin-user">{admin.email}</p>
        <button
          type="button"
          className="admin-button"
          disabled={loggingOut}
          onClick={exit}
        >
          {loggingOut ? 'Saindo…' : 'Sair'}
        </button>
      </header>
      <p role="alert" className="admin-error">
        {error && 'Não foi possível sair. Tente novamente.'}
      </p>
      <RestaurantList />
    </main>
  );
}
