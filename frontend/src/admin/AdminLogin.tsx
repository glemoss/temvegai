import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  InvalidCredentialsError,
  login,
  TooManyAttemptsError,
} from '../api/auth';
import { AppTitle } from '../AppTitle';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (reason) {
      setError(
        reason instanceof InvalidCredentialsError ||
          reason instanceof TooManyAttemptsError
          ? reason.message
          : 'Não foi possível entrar. Tente novamente mais tarde.',
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-page admin-centered">
      <form className="admin-login" onSubmit={submit}>
        <AppTitle />
        <label>
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {/* Always present, so screen readers announce the error. */}
        <p role="alert" className="admin-error">
          {error}
        </p>
        <button type="submit" className="admin-button" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
