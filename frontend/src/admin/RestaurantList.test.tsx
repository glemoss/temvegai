// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Restaurant } from '../api/restaurants';
import { RestaurantList } from './RestaurantList';
import type { AdminRestaurantsState } from './useAdminRestaurants';

function restaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
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
    ...overrides,
  };
}

const restaurants = [
  restaurant({ id: '1', name: 'Café Conceição', neighborhood: 'Lagoa' }),
  restaurant({
    id: '2',
    name: 'Janela Bar',
    type: 'vegan_options',
    neighborhood: 'Centro',
  }),
  restaurant({ id: '3', name: 'Mandarina' }),
];

function rowNames(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelector('td')?.textContent ?? '');
}

function typeSearch(value: string) {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar por nome' }), {
    target: { value },
  });
}

function renderList(
  state: AdminRestaurantsState = { status: 'success', restaurants },
  onDelete: (restaurant: Restaurant) => void = () => {},
) {
  render(
    <MemoryRouter>
      <RestaurantList state={state} onDelete={onDelete} />
    </MemoryRouter>,
  );
}

function addLink() {
  return screen.getByRole('link', { name: 'Novo restaurante' });
}

afterEach(() => {
  cleanup();
});

describe('RestaurantList', () => {
  it('shows a loading message', () => {
    renderList({ status: 'loading' });

    expect(screen.getByText('Carregando restaurantes…')).toBeTruthy();
    expect(addLink()).toBeTruthy();
  });

  it('shows an error message', () => {
    renderList({ status: 'error' });

    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível carregar os restaurantes. Tente novamente mais tarde.',
    );
  });

  it('shows a message when there are no restaurants', () => {
    renderList({ status: 'success', restaurants: [] });

    expect(screen.getByText('Nenhum restaurante cadastrado.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(addLink().getAttribute('href')).toBe('/restaurants/new');
  });

  it('shows name, type and neighborhood of every restaurant', () => {
    renderList();

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Nome', 'Tipo', 'Bairro', 'Ações']);
    expect(rowNames()).toEqual(['Café Conceição', 'Janela Bar', 'Mandarina']);

    const janela = screen.getByText('Janela Bar').closest('tr');
    expect(
      [...(janela?.querySelectorAll('td') ?? [])].map(
        (cell) => cell.textContent,
      ),
    ).toEqual(['Janela Bar', 'Opções veganas', 'Centro', '']);
  });

  it('filters by name ignoring case and accents', () => {
    renderList();

    typeSearch('  CAFE conceicao ');

    expect(rowNames()).toEqual(['Café Conceição']);
  });

  it('shows a message when no name matches', () => {
    renderList();

    typeSearch('pizzaria');

    expect(screen.getByText('Nenhum restaurante com esse nome.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows every restaurant again when the search is cleared', () => {
    renderList();

    typeSearch('janela');
    typeSearch('');

    expect(rowNames()).toEqual(['Café Conceição', 'Janela Bar', 'Mandarina']);
  });

  it('links every restaurant to its edit', () => {
    renderList();

    expect(
      screen
        .getByRole('link', { name: 'Editar Janela Bar' })
        .getAttribute('href'),
    ).toBe('/restaurants/2/edit');
  });

  it('asks to remove the restaurant of the row', () => {
    const onDelete = vi.fn();
    renderList({ status: 'success', restaurants }, onDelete);

    fireEvent.click(screen.getByRole('button', { name: 'Remover Janela Bar' }));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(restaurants[1]);
  });

  it('puts the add button on the line of the search', () => {
    renderList();

    const toolbar = addLink().parentElement;
    expect(toolbar?.contains(screen.getByRole('searchbox'))).toBe(true);
  });
});
