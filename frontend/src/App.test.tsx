import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

// Leaflet needs a browser DOM, so the map components are replaced by
// plain elements that expose the props they receive.
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
}));

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
});
