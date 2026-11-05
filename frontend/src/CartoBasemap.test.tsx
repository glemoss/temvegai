// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARTO_STYLE_URL, CartoBasemap } from './CartoBasemap';
import { config } from './config';

const leafletMap = vi.hoisted(() => ({}));

// The MapLibre map inside the layer, which keeps the handlers registered
// on it so the tests can fire them.
const glMap = vi.hoisted(() => ({
  handlers: new Map<string, () => void>(),
  on(event: string, handler: () => void) {
    this.handlers.set(event, handler);
  },
  getStyle: () => ({ layers: [{ id: 'water' }, { id: 'road_minor_fill' }] }),
  setPaintProperty: vi.fn(),
}));

const layer = vi.hoisted(() => ({
  addTo: vi.fn(),
  getMaplibreMap: () => glMap,
  remove: vi.fn(),
}));

const maplibreGL = vi.hoisted(() => vi.fn());

vi.mock('react-leaflet', () => ({ useMap: () => leafletMap }));
vi.mock('@maplibre/maplibre-gl-leaflet', () => ({ maplibreGL }));
vi.mock('maplibre-gl', () => ({ setWorkerUrl: () => {} }));

maplibreGL.mockReturnValue(layer);
layer.addTo.mockReturnValue(layer);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  maplibreGL.mockReturnValue(layer);
  layer.addTo.mockReturnValue(layer);
  glMap.handlers.clear();
});

describe('CartoBasemap', () => {
  it('adds the CARTO Voyager vector style with the key to the map', () => {
    render(<CartoBasemap />);

    expect(CARTO_STYLE_URL).toBe(
      `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=${encodeURIComponent(config.cartoKey)}`,
    );
    expect(maplibreGL).toHaveBeenCalledWith({ style: CARTO_STYLE_URL });
    expect(layer.addTo).toHaveBeenCalledWith(leafletMap);
  });

  it('applies the colors once the style loads', () => {
    render(<CartoBasemap />);
    expect(glMap.setPaintProperty).not.toHaveBeenCalled();

    glMap.handlers.get('style.load')?.();

    expect(glMap.setPaintProperty).toHaveBeenCalledWith(
      'water',
      'fill-color',
      '#a3c9e2',
    );
  });

  it('removes the layer when the map goes away', () => {
    const { unmount } = render(<CartoBasemap />);

    unmount();

    expect(layer.remove).toHaveBeenCalled();
  });
});
