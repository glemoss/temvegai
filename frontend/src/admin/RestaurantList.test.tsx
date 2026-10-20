// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Restaurant } from '../api/restaurants';
import { RestaurantList } from './RestaurantList';
import { useAdminRestaurants } from './useAdminRestaurants';

vi.mock('./useAdminRestaurants', () => ({ useAdminRestaurants: vi.fn() }));

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

beforeEach(() => {
  vi.mocked(useAdminRestaurants).mockReturnValue({
    status: 'success',
    restaurants,
  });
});

afterEach(() => {
  cleanup();
});

describe('RestaurantList', () => {
  it('shows a loading message', () => {
    vi.mocked(useAdminRestaurants).mockReturnValue({ status: 'loading' });
    render(<RestaurantList />);

    expect(screen.getByRole('status').textContent).toBe(
      'Carregando restaurantes…',
    );
  });

  it('shows an error message', () => {
    vi.mocked(useAdminRestaurants).mockReturnValue({ status: 'error' });
    render(<RestaurantList />);

    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível carregar os restaurantes. Tente novamente mais tarde.',
    );
  });

  it('shows a message when there are no restaurants', () => {
    vi.mocked(useAdminRestaurants).mockReturnValue({
      status: 'success',
      restaurants: [],
    });
    render(<RestaurantList />);

    expect(screen.getByRole('status').textContent).toBe(
      'Nenhum restaurante cadastrado.',
    );
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows name, type and neighborhood of every restaurant', () => {
    render(<RestaurantList />);

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Nome', 'Tipo', 'Bairro']);
    expect(rowNames()).toEqual(['Café Conceição', 'Janela Bar', 'Mandarina']);

    const janela = screen.getByText('Janela Bar').closest('tr');
    expect(
      [...(janela?.querySelectorAll('td') ?? [])].map(
        (cell) => cell.textContent,
      ),
    ).toEqual(['Janela Bar', 'Opções veganas', 'Centro']);
  });

  it('filters by name ignoring case and accents', () => {
    render(<RestaurantList />);

    typeSearch('  CAFE conceicao ');

    expect(rowNames()).toEqual(['Café Conceição']);
  });

  it('shows a message when no name matches', () => {
    render(<RestaurantList />);

    typeSearch('pizzaria');

    expect(screen.getByRole('status').textContent).toBe(
      'Nenhum restaurante com esse nome.',
    );
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows every restaurant again when the search is cleared', () => {
    render(<RestaurantList />);

    typeSearch('janela');
    typeSearch('');

    expect(rowNames()).toEqual(['Café Conceição', 'Janela Bar', 'Mandarina']);
  });
});
