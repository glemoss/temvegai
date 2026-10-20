// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Restaurant } from './api/restaurants';
import { useRestaurants } from './useRestaurants';

// Leaflet needs a real browser to lay out the map, so the map components
// are replaced by plain elements that expose the props they receive. Each
// marker is a button that triggers its click handler.
vi.mock('leaflet', () => ({ icon: () => ({}) }));
vi.mock('react-leaflet', () => ({
  MapContainer: (props: {
    center: [number, number];
    zoom: number;
    children: ReactNode;
  }) => (
    <div
      data-testid="map"
      data-center={props.center.join(',')}
      data-zoom={props.zoom}
    >
      {props.children}
    </div>
  ),
  TileLayer: (props: { url: string; attribution: string }) => (
    <div
      data-testid="tiles"
      data-url={props.url}
      data-attribution={props.attribution}
    />
  ),
  Marker: (props: {
    position: [number, number];
    title: string;
    eventHandlers: { click: () => void };
  }) => (
    <button
      type="button"
      data-testid="marker"
      data-position={props.position.join(',')}
      onClick={props.eventHandlers.click}
    >
      {props.title}
    </button>
  ),
}));

// Each test sets the state the hook returns instead of making a request.
vi.mock('./useRestaurants', () => ({ useRestaurants: vi.fn() }));

const restaurants: Restaurant[] = [
  {
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
  },
  {
    id: 'b3f1c0de-7d8e-4f5a-9c2b-1e0a3d4c5b6f',
    name: 'Girassol',
    description: null,
    type: 'vegan_options',
    address: 'Rua Tenente Silveira, 20',
    neighborhood: 'Centro',
    latitude: -27.5969,
    longitude: -48.5495,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  },
];

beforeEach(() => {
  vi.mocked(useRestaurants).mockReturnValue({ status: 'loading' });
});

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('shows the project title', () => {
    const html = renderToString(<App />);

    expect(html).toContain('Tem Veg Aí?</h1>');
  });

  it('centers the map on Florianópolis', () => {
    const html = renderToString(<App />);

    expect(html).toContain('data-center="-27.5954,-48.548"');
    expect(html).toContain('data-zoom="12"');
  });

  it('uses OpenStreetMap tiles with attribution', () => {
    const html = renderToString(<App />);

    expect(html).toContain(
      'data-url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"',
    );
    expect(html).toContain('OpenStreetMap');
  });

  it('shows a loading message and no markers while loading', () => {
    const html = renderToString(<App />);

    expect(html).toContain('Carregando restaurantes…');
    expect(html).not.toContain('data-testid="marker"');
  });

  it('shows an error message and keeps the map when loading fails', () => {
    vi.mocked(useRestaurants).mockReturnValue({ status: 'error' });

    const html = renderToString(<App />);

    expect(html).toContain('Não foi possível carregar os restaurantes.');
    expect(html).toContain('data-testid="map"');
    expect(html).not.toContain('data-testid="marker"');
  });

  it('shows one marker per restaurant at its coordinates', () => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });

    const html = renderToString(<App />);

    expect(html).toContain('data-position="-27.661458,-48.499222"');
    expect(html).toContain('data-position="-27.5969,-48.5495"');
    expect(html).not.toContain('Carregando restaurantes…');
    expect(html).not.toContain('Não foi possível');
  });
});

describe('App restaurant details', () => {
  beforeEach(() => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
  });

  it('shows no panel before a marker is clicked', () => {
    render(<App />);

    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('opens the panel of the clicked restaurant', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    const panel = screen.getByRole('complementary', { name: 'Mandarina' });
    expect(panel.textContent).toContain('Rua das Flores, 100 — Campeche');
  });

  it('switches the panel when another marker is clicked', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Girassol' }));

    expect(screen.getAllByRole('complementary')).toHaveLength(1);
    const panel = screen.getByRole('complementary', { name: 'Girassol' });
    expect(panel.textContent).toContain('Rua Tenente Silveira, 20 — Centro');
  });

  it('closes the panel with the close button', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('opens the panel again after closing it', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(
      screen.getByRole('complementary', { name: 'Mandarina' }),
    ).toBeDefined();
  });
});
