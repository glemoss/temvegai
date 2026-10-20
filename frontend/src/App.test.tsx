import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useRestaurants } from './useRestaurants';

// Leaflet needs a browser DOM, so the map components are replaced by
// plain elements that expose the props they receive.
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
  Marker: (props: { position: [number, number] }) => (
    <div data-testid="marker" data-position={props.position.join(',')} />
  ),
}));

// The request runs in an effect, which renderToString does not run, so
// each test sets the state the hook returns.
vi.mock('./useRestaurants', () => ({ useRestaurants: vi.fn() }));

const restaurants = [
  {
    id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
    latitude: -27.661458,
    longitude: -48.499222,
  },
  {
    id: 'b3f1c0de-7d8e-4f5a-9c2b-1e0a3d4c5b6f',
    latitude: -27.5969,
    longitude: -48.5495,
  },
];

beforeEach(() => {
  vi.mocked(useRestaurants).mockReturnValue({ status: 'loading' });
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
