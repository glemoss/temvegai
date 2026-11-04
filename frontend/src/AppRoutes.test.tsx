// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './AppRoutes';

// The pages are replaced by plain text, so the test only checks which one
// each path shows.
vi.mock('./App', () => ({ App: () => <p>Mapa</p> }));
vi.mock('./admin/AdminLogin', () => ({
  AdminLogin: () => <p>Tela de login</p>,
}));
vi.mock('./admin/RequireAdmin', () => ({
  RequireAdmin: () => <p>Painel</p>,
}));
vi.mock('./admin/AdminHome', () => ({ AdminHome: () => null }));
vi.mock('./admin/NewRestaurant', () => ({ NewRestaurant: () => null }));
vi.mock('./admin/EditRestaurant', () => ({ EditRestaurant: () => null }));

function renderPath(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('AppRoutes', () => {
  it.each(['/xyz', '/admin/xyz', '/admin/restaurants/1'])(
    'shows the not found page at %s, with the site header',
    (path) => {
      renderPath(path);

      expect(screen.getByRole('img', { name: 'Tem Veg Aí?' })).toBeTruthy();
      expect(
        screen.getByRole('heading', { name: 'Página não encontrada' }),
      ).toBeTruthy();
      expect(screen.queryByText('Painel')).toBeNull();
    },
  );

  it('links the not found page to the map', () => {
    renderPath('/xyz');

    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao mapa' }));

    expect(screen.getByText('Mapa')).toBeTruthy();
    expect(screen.queryByText('Página não encontrada')).toBeNull();
  });

  it.each([
    ['/', 'Mapa'],
    ['/admin', 'Painel'],
    ['/admin/login', 'Tela de login'],
  ])('keeps the page at %s', (path, page) => {
    renderPath(path);

    expect(screen.getByText(page)).toBeTruthy();
    expect(screen.queryByText('Página não encontrada')).toBeNull();
  });
});
