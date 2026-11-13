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
import {
  fetchRestaurant,
  fetchRestaurants,
  RestaurantNotFoundError,
  UnauthenticatedError,
  updateRestaurant,
  type Restaurant,
} from '../api/restaurants';
import { EditRestaurant } from './EditRestaurant';
import { RequireAdmin } from './RequireAdmin';
import { RestaurantsPage } from './RestaurantsPage';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/restaurants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/restaurants')>()),
  fetchRestaurant: vi.fn(),
  fetchRestaurants: vi.fn(),
  updateRestaurant: vi.fn(),
}));
vi.mock('../api/geocoding', () => ({
  geocodeAddress: vi.fn(),
  reverseGeocode: vi.fn(),
}));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));
vi.mock('../api/suggestions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/suggestions')>()),
  fetchSuggestions: vi.fn().mockResolvedValue([]),
}));
vi.mock('../useNeighborhoods', () => ({
  useNeighborhoods: () => ({ status: 'loading' }),
}));
vi.mock('./LocationPicker', () => ({ LocationPicker: () => null }));

const mandarina: Restaurant = {
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
  instagram: 'mandarinafloripa',
  openingHours: null,
};

const editPath = `/admin/restaurants/${mandarina.id}/edit`;

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
          <Route path="restaurants" element={<RestaurantsPage />}>
            <Route index element={null} />
            <Route path=":id/edit" element={<EditRestaurant />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function modal() {
  return screen.queryByRole('dialog', { name: 'Editar restaurante' });
}

function input(label: string): HTMLInputElement {
  const element = screen.getByLabelText(label);
  if (!(element instanceof HTMLInputElement)) throw new Error('not an input');
  return element;
}

async function renameAndSave(name: string) {
  fireEvent.change(await screen.findByLabelText('Nome'), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
}

beforeEach(() => {
  vi.mocked(fetchRestaurant).mockReset().mockResolvedValue(mandarina);
  vi.mocked(fetchRestaurants).mockReset().mockResolvedValue([mandarina]);
  vi.mocked(updateRestaurant).mockReset();
  vi.mocked(useCurrentAdmin).mockReturnValue({
    status: 'authenticated',
    admin: { id: '1', email: 'admin@example.com' },
  });
});

afterEach(() => {
  cleanup();
});

describe('EditRestaurant', () => {
  it('opens from the list as a modal filled with the restaurant', async () => {
    renderPanel('/admin/restaurants');

    fireEvent.click(
      await screen.findByRole('link', { name: 'Editar Mandarina' }),
    );

    expect(modal()?.getAttribute('data-state')).toBe('open');
    expect((await screen.findByLabelText('Nome')).getAttribute('value')).toBe(
      'Mandarina',
    );
    expect(input('Endereço').value).toBe('Rua das Flores, 100');
    expect(input('Bairro').value).toBe('Campeche');
    expect(input('Latitude').value).toBe('-27.661458');
    expect(input('Instagram').value).toBe('mandarinafloripa');
    expect(
      screen.getByLabelText('100% vegano').getAttribute('aria-checked'),
    ).toBe('true');
    expect(fetchRestaurant).toHaveBeenCalledWith(
      mandarina.id,
      expect.any(AbortSignal),
    );
  });

  it('shows a message while the restaurant loads', () => {
    vi.mocked(fetchRestaurant).mockReturnValue(new Promise(() => {}));
    renderPanel(editPath);

    expect(screen.getByText('Carregando restaurante…')).toBeTruthy();
  });

  it('saves the restaurant, closes and reloads the list', async () => {
    vi.mocked(updateRestaurant).mockResolvedValue({
      ...mandarina,
      name: 'Mandarina Campeche',
    });
    renderPanel(editPath);
    await waitFor(() => expect(fetchRestaurants).toHaveBeenCalledOnce());
    vi.mocked(fetchRestaurants).mockResolvedValue([
      { ...mandarina, name: 'Mandarina Campeche' },
    ]);

    await renameAndSave('Mandarina Campeche');

    expect(
      await screen.findByText('Restaurante “Mandarina Campeche” atualizado.'),
    ).toBeTruthy();
    // React Router navigates in a transition, so the modal may close a
    // moment after the notice appears.
    await waitFor(() => expect(modal()).toBeNull());
    expect(
      await screen.findByRole('cell', { name: 'Mandarina Campeche' }),
    ).toBeTruthy();
    expect(fetchRestaurants).toHaveBeenCalledTimes(2);
    // An undefined property counts as missing, so the id is left out.
    expect(updateRestaurant).toHaveBeenCalledWith(mandarina.id, {
      ...mandarina,
      id: undefined,
      name: 'Mandarina Campeche',
    });
  });

  it('shows an error when the restaurant does not exist', async () => {
    vi.mocked(fetchRestaurant).mockResolvedValue(null);
    renderPanel('/admin/restaurants/abc/edit');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Restaurante não encontrado.',
    );
    expect(screen.queryByLabelText('Nome')).toBeNull();
  });

  it('shows an error when the restaurant cannot be loaded', async () => {
    vi.mocked(fetchRestaurant).mockRejectedValue(new Error('offline'));
    renderPanel(editPath);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Não foi possível carregar o restaurante. Tente novamente mais tarde.',
    );
  });

  it('closes with a notice and reloads the list when the restaurant was removed meanwhile', async () => {
    vi.mocked(updateRestaurant).mockRejectedValue(
      new RestaurantNotFoundError(),
    );
    renderPanel(editPath);
    await waitFor(() => expect(fetchRestaurants).toHaveBeenCalledOnce());
    vi.mocked(fetchRestaurants).mockResolvedValue([]);

    await renameAndSave('Mandarina Campeche');

    expect(
      await screen.findByText('Oops, esse restaurante não existe mais.'),
    ).toBeTruthy();
    await waitFor(() => expect(modal()).toBeNull());
    expect(
      await screen.findByText('Nenhum restaurante cadastrado.'),
    ).toBeTruthy();
  });

  it('goes to the login page when the session expired', async () => {
    vi.mocked(updateRestaurant).mockRejectedValue(new UnauthenticatedError());
    renderPanel(editPath);

    await renameAndSave('Mandarina Campeche');

    expect(await screen.findByText('Tela de login')).toBeTruthy();
  });

  it('closes with the close button, Cancel and Esc without saving', async () => {
    renderPanel(editPath);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(modal()).toBeNull();
    cleanup();

    renderPanel(editPath);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(modal()).toBeNull();
    cleanup();

    renderPanel(editPath);
    const dialog = modal();
    if (!dialog) throw new Error('modal not open');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(modal()).toBeNull();

    expect(updateRestaurant).not.toHaveBeenCalled();
  });
});
