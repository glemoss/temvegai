import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { logout, type Admin } from '../api/auth';

// The top of every panel page: the way back to the list, the logged in
// admin and the logout button.
export function AdminHeader({ admin }: { admin: Admin }) {
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
    <>
      <header className="admin-header">
        <h1 className="admin-title">
          <Link to="/admin">Painel admin</Link>
        </h1>
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
      <p role="alert" className="admin-error admin-header-error">
        {error && 'Não foi possível sair. Tente novamente.'}
      </p>
    </>
  );
}
