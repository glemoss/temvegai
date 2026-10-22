// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Coordinates } from '../api/geocoding';
import {
  createRestaurant,
  fetchRestaurants,
  UnauthenticatedError,
  type Restaurant,
} from '../api/restaurants';
import { AdminHome } from './AdminHome';
import { NewRestaurant } from './NewRestaurant';
import { RequireAdmin } from './RequireAdmin';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/restaurants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/restaurants')>()),
  createRestaurant: vi.fn(),
  fetchRestaurants: vi.fn(),
}));
vi.mock('../api/geocoding', () => ({ geocodeAddress: vi.fn() }));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));
vi.mock('../useNeighborhoods', () => ({
  useNeighborhoods: () => ({ status: 'loading' }),
}));
vi.mock('./LocationPicker', () => ({
  LocationPicker: ({
    onChange,
  }: {
    onChange: (location: Coordinates) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange({ latitude: -27.661458, longitude: -48.499222 })}
    >
      Marcar no mapa
    </button>
  ),
}));

const created: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Mandarina',
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

// jsdom has no ResizeObserver, which the radio buttons use.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderPanel(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<p>Tela de login</p>} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminHome />}>
            <Route index element={null} />
            <Route path="restaurants/new" element={<NewRestaurant />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function modal() {
  return screen.queryByRole('dialog', { name: 'Novo restaurante' });
}

function fillAndSubmit() {
  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  type('Nome', 'Mandarina');
  fireEvent.click(screen.getByLabelText('100% vegano'));
  type('Endereço', 'Rua das Flores, 100');
  type('Bairro', 'Campeche');
  fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
}

beforeEach(() => {
  vi.mocked(createRestaurant).mockReset();
  vi.mocked(fetchRestaurants).mockReset().mockResolvedValue([]);
  vi.mocked(useCurrentAdmin).mockReturnValue({
    status: 'authenticated',
    admin: { id: '1', email: 'admin@example.com' },
  });
});

afterEach(() => {
  cleanup();
});

describe('NewRestaurant', () => {
  it('opens as a modal over the list, below the panel header', async () => {
    renderPanel('/admin');
    expect(
      await screen.findByText('Nenhum restaurante cadastrado.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Novo restaurante' }));

    expect(modal()?.getAttribute('data-state')).toBe('open');
    expect(screen.getByText('Nenhum restaurante cadastrado.')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
  });

  it('creates the restaurant, closes and reloads the list', async () => {
    vi.mocked(createRestaurant).mockResolvedValue(created);
    renderPanel('/admin/restaurants/new');
    await waitFor(() => expect(fetchRestaurants).toHaveBeenCalledOnce());
    vi.mocked(fetchRestaurants).mockResolvedValue([created]);

    fillAndSubmit();

    expect(
      await screen.findByText('Restaurante “Mandarina” adicionado.'),
    ).toBeTruthy();
    // React Router navigates in a transition, so the modal may close a
    // moment after the notice appears.
    await waitFor(() => expect(modal()).toBeNull());
    expect(await screen.findByRole('cell', { name: 'Mandarina' })).toBeTruthy();
    expect(fetchRestaurants).toHaveBeenCalledTimes(2);
    expect(createRestaurant).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mandarina', neighborhood: 'Campeche' }),
    );
  });

  it('goes to the login page when the session expired', async () => {
    vi.mocked(createRestaurant).mockRejectedValue(new UnauthenticatedError());
    renderPanel('/admin/restaurants/new');

    fillAndSubmit();

    expect(await screen.findByText('Tela de login')).toBeTruthy();
  });

  it('closes with the close button, Cancel and Esc without creating', () => {
    renderPanel('/admin/restaurants/new');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(modal()).toBeNull();
    cleanup();

    renderPanel('/admin/restaurants/new');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(modal()).toBeNull();
    cleanup();

    renderPanel('/admin/restaurants/new');
    const dialog = modal();
    if (!dialog) throw new Error('modal not open');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(modal()).toBeNull();

    expect(createRestaurant).not.toHaveBeenCalled();
  });
});
