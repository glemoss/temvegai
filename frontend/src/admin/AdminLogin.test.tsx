// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  InvalidCredentialsError,
  login,
  TooManyAttemptsError,
} from '../api/auth';
import { AdminLogin } from './AdminLogin';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/auth')>()),
  login: vi.fn(),
}));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<p>Painel aberto</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  vi.mocked(login).mockReset();
  vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'unauthenticated' });
});

afterEach(() => {
  cleanup();
});

describe('AdminLogin', () => {
  it('shows the project title', () => {
    renderLogin();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tem Veg Aí?' }),
    ).toBeTruthy();
  });

  it('sends the trimmed e-mail and the password and opens the panel', async () => {
    vi.mocked(login).mockResolvedValue({ id: '1', email: 'admin@example.com' });
    renderLogin();

    submit(' admin@example.com ', 'a long password');

    expect(await screen.findByText('Painel aberto')).toBeTruthy();
    expect(login).toHaveBeenCalledWith('admin@example.com', 'a long password');
  });

  it('shows an error for wrong credentials and stays on the page', async () => {
    vi.mocked(login).mockRejectedValue(new InvalidCredentialsError());
    renderLogin();

    submit('admin@example.com', 'wrong');

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'E-mail ou senha inválidos.',
      ),
    );
    expect(screen.queryByText('Painel aberto')).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Entrar' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('shows the too many attempts message', async () => {
    vi.mocked(login).mockRejectedValue(new TooManyAttemptsError());
    renderLogin();

    submit('admin@example.com', 'wrong');

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Muitas tentativas. Tente novamente mais tarde.',
      ),
    );
  });

  it('shows a generic error when the API cannot be reached', async () => {
    vi.mocked(login).mockRejectedValue(new TypeError('Failed to fetch'));
    renderLogin();

    submit('admin@example.com', 'secret');

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Não foi possível entrar. Tente novamente mais tarde.',
      ),
    );
  });

  it('disables the button while logging in', () => {
    vi.mocked(login).mockReturnValue(new Promise(() => {}));
    renderLogin();

    submit('admin@example.com', 'secret');

    const button = screen.getByRole('button', {
      name: 'Entrando…',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('opens the panel when the admin is already logged in', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({
      status: 'authenticated',
      admin: { id: '1', email: 'admin@example.com' },
    });
    renderLogin();

    expect(screen.getByText('Painel aberto')).toBeTruthy();
    expect(screen.queryByLabelText('E-mail')).toBeNull();
  });

  it('waits for the session check before showing the form', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'loading' });
    renderLogin();

    expect(screen.getByRole('status').textContent).toBe('Verificando sessão…');
    expect(screen.queryByLabelText('E-mail')).toBeNull();
  });

  it('shows the form when the session cannot be checked', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'error' });
    renderLogin();

    expect(screen.getByLabelText('E-mail')).toBeTruthy();
  });
});
