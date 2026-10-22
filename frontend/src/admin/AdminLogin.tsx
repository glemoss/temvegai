import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const emailId = useId();
  const passwordId = useId();

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
    <main className="flex min-h-full items-center justify-center bg-secondary px-4 py-6">
      <form
        className="flex w-full max-w-100 flex-col gap-3 rounded-lg bg-card p-6 shadow-(--shadow)"
        onSubmit={submit}
      >
        <AppTitle />
        <div className="flex flex-col gap-2">
          <Label htmlFor={emailId}>E-mail</Label>
          <Input
            id={emailId}
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={passwordId}>Senha</Label>
          <Input
            id={passwordId}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {/* Always present, so screen readers announce the error. It keeps
          two lines even when empty, so the box does not grow when the
          error appears; the longest messages take two lines. */}
        <p
          role="alert"
          className="min-h-[2.8em] font-semibold text-destructive"
        >
          {error}
        </p>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
