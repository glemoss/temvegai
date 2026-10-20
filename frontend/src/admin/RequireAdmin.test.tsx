// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequireAdmin, useAdminSession } from './RequireAdmin';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));

function PanelPage() {
  const { admin } = useAdminSession();
  return <p>Painel de {admin.email}</p>;
}

function renderPanel() {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<p>Tela de login</p>} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index element={<PanelPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('RequireAdmin', () => {
  it('shows a message while the session is checked', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'loading' });
    renderPanel();

    expect(screen.getByRole('status').textContent).toBe('Verificando sessão…');
    expect(screen.queryByText(/Painel de/)).toBeNull();
  });

  it('shows the panel page to a logged in admin', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({
      status: 'authenticated',
      admin: { id: '1', email: 'admin@example.com' },
    });
    renderPanel();

    expect(screen.getByText('Painel de admin@example.com')).toBeTruthy();
  });

  it('sends visitors without a session to the login page', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'unauthenticated' });
    renderPanel();

    expect(screen.getByText('Tela de login')).toBeTruthy();
  });

  it('shows an error when the session cannot be checked', () => {
    vi.mocked(useCurrentAdmin).mockReturnValue({ status: 'error' });
    renderPanel();

    expect(screen.getByRole('status').textContent).toBe(
      'Não foi possível verificar a sessão. Tente novamente mais tarde.',
    );
    expect(screen.queryByText('Tela de login')).toBeNull();
  });
});
