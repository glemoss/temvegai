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
import { logout } from '../api/auth';
import { AdminHome } from './AdminHome';
import { RequireAdmin } from './RequireAdmin';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/auth', () => ({ logout: vi.fn() }));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));
vi.mock('./useAdminRestaurants', () => ({
  useAdminRestaurants: () => ({ status: 'success', restaurants: [] }),
}));

function renderHome() {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<p>Tela de login</p>} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index element={<AdminHome />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(logout).mockReset();
  vi.mocked(useCurrentAdmin).mockReturnValue({
    status: 'authenticated',
    admin: { id: '1', email: 'admin@example.com' },
  });
});

afterEach(() => {
  cleanup();
});

describe('AdminHome', () => {
  it('shows the e-mail of the logged in admin', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'Painel admin' })).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
  });

  it('logs out and goes to the login page', async () => {
    vi.mocked(logout).mockResolvedValue();
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByText('Tela de login')).toBeTruthy();
    expect(logout).toHaveBeenCalledOnce();
  });

  it('stays on the panel and shows an error when logout fails', async () => {
    vi.mocked(logout).mockRejectedValue(new Error('POST /auth/logout 500'));
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Não foi possível sair. Tente novamente.',
      ),
    );
    expect(screen.queryByText('Tela de login')).toBeNull();
  });
});
