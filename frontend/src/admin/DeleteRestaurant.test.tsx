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
  deleteRestaurant,
  fetchRestaurants,
  RestaurantNotFoundError,
  UnauthenticatedError,
  type Restaurant,
} from '../api/restaurants';
import { AdminHome } from './AdminHome';
import { RequireAdmin } from './RequireAdmin';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/restaurants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/restaurants')>()),
  deleteRestaurant: vi.fn(),
  fetchRestaurants: vi.fn(),
}));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));

function restaurant(id: string, name: string): Restaurant {
  return {
    id,
    name,
    description: null,
    type: 'fully_vegan',
    address: 'Rua das Flores, 100',
    neighborhood: 'Campeche',
    latitude: -27.661458,
    longitude: -48.499222,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  };
}

const mandarina = restaurant('1', 'Mandarina');
const janela = restaurant('2', 'Janela Bar');

function renderPanel() {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<p>Tela de login</p>} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminHome />}>
            <Route index element={null} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function confirmation() {
  return screen.queryByRole('alertdialog', { name: 'Remover restaurante?' });
}

async function askToRemove(name: string) {
  fireEvent.click(
    await screen.findByRole('button', { name: `Remover ${name}` }),
  );
}

beforeEach(() => {
  vi.mocked(fetchRestaurants)
    .mockReset()
    .mockResolvedValue([mandarina, janela]);
  vi.mocked(deleteRestaurant).mockReset();
  vi.mocked(useCurrentAdmin).mockReturnValue({
    status: 'authenticated',
    admin: { id: '1', email: 'admin@example.com' },
  });
});

afterEach(() => {
  cleanup();
});

describe('removing a restaurant', () => {
  it('asks for confirmation naming the restaurant', async () => {
    renderPanel();

    await askToRemove('Mandarina');

    expect(confirmation()?.textContent).toContain(
      '“Mandarina” será removido do mapa e do painel.',
    );
    expect(deleteRestaurant).not.toHaveBeenCalled();
  });

  it('removes nothing when cancelled with the button or Esc', async () => {
    renderPanel();

    await askToRemove('Mandarina');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(confirmation()).toBeNull();

    await askToRemove('Mandarina');
    const dialog = confirmation();
    if (!dialog) throw new Error('confirmation not open');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(confirmation()).toBeNull();

    expect(deleteRestaurant).not.toHaveBeenCalled();
    expect(screen.getByRole('cell', { name: 'Mandarina' })).toBeTruthy();
    expect(fetchRestaurants).toHaveBeenCalledOnce();
  });

  it('removes the restaurant, closes and reloads the list', async () => {
    renderPanel();
    await askToRemove('Mandarina');
    vi.mocked(deleteRestaurant).mockResolvedValue();
    vi.mocked(fetchRestaurants).mockResolvedValue([janela]);

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText('Restaurante “Mandarina” removido.'),
    ).toBeTruthy();
    expect(confirmation()).toBeNull();
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Mandarina' })).toBeNull(),
    );
    expect(screen.getByRole('cell', { name: 'Janela Bar' })).toBeTruthy();
    expect(deleteRestaurant).toHaveBeenCalledExactlyOnceWith('1');
  });

  it('keeps the confirmation open while the removal is on its way', async () => {
    vi.mocked(deleteRestaurant).mockReturnValue(new Promise(() => {}));
    renderPanel();
    await askToRemove('Mandarina');

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    const removing = screen.getByRole('button', { name: 'Removendo…' });
    expect(removing).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty(
      'disabled',
      true,
    );
    fireEvent.keyDown(removing, { key: 'Escape' });
    expect(confirmation()).not.toBeNull();
  });

  it('shows an error in the confirmation when the removal fails', async () => {
    vi.mocked(deleteRestaurant).mockRejectedValue(new Error('offline'));
    renderPanel();
    await askToRemove('Mandarina');

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText(
        'Não foi possível remover o restaurante. Tente novamente mais tarde.',
      ),
    ).toBeTruthy();
    expect(confirmation()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Remover' })).toHaveProperty(
      'disabled',
      false,
    );
  });

  it('closes with a notice and reloads the list when the restaurant was already removed', async () => {
    vi.mocked(deleteRestaurant).mockRejectedValue(
      new RestaurantNotFoundError(),
    );
    renderPanel();
    await askToRemove('Mandarina');
    vi.mocked(fetchRestaurants).mockResolvedValue([janela]);

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText('Oops, esse restaurante não existe mais.'),
    ).toBeTruthy();
    expect(confirmation()).toBeNull();
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Mandarina' })).toBeNull(),
    );
  });

  it('goes to the login page when the session expired', async () => {
    vi.mocked(deleteRestaurant).mockRejectedValue(new UnauthenticatedError());
    renderPanel();
    await askToRemove('Mandarina');

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(await screen.findByText('Tela de login')).toBeTruthy();
  });
});
