import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { logout, type Admin } from '../api/auth';

// The top of every panel page: the way back to the panel, the menu given
// as children, the logged in admin and the logout button.
export function AdminHeader({
  admin,
  children,
}: {
  admin: Admin;
  children?: ReactNode;
}) {
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
      <header className="mx-auto flex max-w-240 flex-wrap items-center gap-3">
        <h1 className="font-display text-[2rem] tracking-wide text-secondary-foreground">
          <Link to="/admin" className="hover:underline">
            Painel admin
          </Link>
        </h1>
        {children}
        <p className="ml-auto wrap-anywhere text-muted-foreground">
          {admin.email}
        </p>
        <Button type="button" size="lg" disabled={loggingOut} onClick={exit}>
          {loggingOut ? 'Saindo…' : 'Sair'}
        </Button>
      </header>
      <p
        role="alert"
        className="mx-auto mt-2 max-w-240 font-semibold text-destructive empty:hidden"
      >
        {error && 'Não foi possível sair. Tente novamente.'}
      </p>
    </>
  );
}
