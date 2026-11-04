// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Neighborhood } from './api/neighborhoods';
import type { Restaurant } from './api/restaurants';
import { useNeighborhoods } from './useNeighborhoods';
import { useRestaurantSuggestions } from './useRestaurantSuggestions';
import { useRestaurants } from './useRestaurants';

// The map handed to the components that read the visible area and move the
// map, with the area of the initial view.
const fakeMap = vi.hoisted(() => ({
  getBounds: () => ({
    getSouth: () => -27.7,
    getNorth: () => -27.5,
    getWest: () => -48.6,
    getEast: () => -48.4,
  }),
  fitBounds: vi.fn(),
  setView: vi.fn(),
  // A 400 by 800 map at the top of the page.
  getSize: () => ({ x: 400, y: 800 }),
  getContainer: () => ({ getBoundingClientRect: () => ({ top: 0 }) }),
  latLngToContainerPoint: vi.fn(),
  panBy: vi.fn(),
}));

// Leaflet needs a real browser to lay out the map, so the map components
// are replaced by plain elements that expose the props they receive. Each
// marker is a button that triggers its click handler, and each icon keeps
// its options so the marker can expose its class.
vi.mock('leaflet', () => ({
  divIcon: (options: { className: string }) => options,
}));
// MapLibre needs WebGL, which the tests don't have; CartoBasemap.test.tsx
// covers the basemap itself.
vi.mock('./CartoBasemap', () => ({
  CartoBasemap: () => <div data-testid="basemap" />,
}));
vi.mock('react-leaflet', () => ({
  useMap: () => fakeMap,
  useMapEvents: () => fakeMap,
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
  ZoomControl: () => null,
  Marker: (props: {
    position: [number, number];
    icon: { className: string };
    zIndexOffset: number;
    title: string;
    eventHandlers: { click: () => void };
  }) => (
    <button
      type="button"
      data-testid="marker"
      data-position={props.position.join(',')}
      data-class={props.icon.className}
      data-z-index-offset={props.zIndexOffset}
      onClick={props.eventHandlers.click}
    >
      {props.title}
    </button>
  ),
}));

// Each test sets the state the hooks return instead of making a request.
vi.mock('./useRestaurants', () => ({ useRestaurants: vi.fn() }));
vi.mock('./useNeighborhoods', () => ({ useNeighborhoods: vi.fn() }));
vi.mock('./useRestaurantSuggestions', () => ({
  useRestaurantSuggestions: vi.fn(),
}));

const neighborhoods: Neighborhood[] = [
  {
    name: 'Campeche',
    bounds: { minLat: -27.68, maxLat: -27.66, minLng: -48.5, maxLng: -48.48 },
  },
  {
    name: 'Centro',
    bounds: { minLat: -27.6, maxLat: -27.59, minLng: -48.56, maxLng: -48.54 },
  },
];

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
  vi.mocked(useNeighborhoods).mockReturnValue({
    status: 'success',
    neighborhoods,
  });
  vi.mocked(useRestaurantSuggestions).mockReturnValue({ status: 'idle' });
  fakeMap.fitBounds.mockClear();
  fakeMap.setView.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('shows the project logo as the title', () => {
    render(<App />);

    const title = screen.getByRole('heading', {
      level: 1,
      name: 'Tem Veg Aí?',
    });
    expect(title.querySelector('img')).not.toBeNull();
  });

  it('centers the map on Florianópolis', () => {
    const html = renderToString(<App />);

    expect(html).toContain('data-center="-27.5954,-48.548"');
    expect(html).toContain('data-zoom="12"');
  });

  it('draws the CARTO basemap under the markers', () => {
    const html = renderToString(<App />);

    expect(html).toContain('data-testid="basemap"');
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

  it('closes the panel with the Escape key', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('moves the focus into the panel when it opens', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(document.activeElement).toBe(
      screen.getByRole('complementary', { name: 'Mandarina' }),
    );
  });

  it('gives the focus back to the marker when the panel closes', () => {
    render(<App />);

    const marker = screen.getByRole('button', { name: 'Mandarina' });
    marker.focus();
    fireEvent.click(marker);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(document.activeElement).toBe(marker);
  });

  it('keeps the panel open when the restaurant leaves the results', () => {
    const { rerender } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants: [restaurants[1]],
    });
    rerender(<App />);

    expect(screen.queryByRole('button', { name: 'Mandarina' })).toBeNull();
    expect(
      screen.getByRole('complementary', { name: 'Mandarina' }),
    ).toBeDefined();
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

describe('App selected marker', () => {
  beforeEach(() => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
    vi.mocked(useRestaurantSuggestions).mockReturnValue({
      status: 'success',
      restaurants: [restaurants[1]!],
    });
  });

  function isHighlighted(name: string) {
    const marker = screen.getByRole('button', { name });
    const highlighted = marker.dataset.class?.includes('pin-marker-selected');
    // A highlighted pin is always in front of the others.
    expect(Number(marker.dataset.zIndexOffset) > 0).toBe(highlighted);
    return highlighted;
  }

  it('highlights no marker before a restaurant is selected', () => {
    render(<App />);

    expect(isHighlighted('Mandarina')).toBe(false);
    expect(isHighlighted('Girassol')).toBe(false);
  });

  it('highlights the clicked marker', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(isHighlighted('Mandarina')).toBe(true);
    expect(isHighlighted('Girassol')).toBe(false);
  });

  it('moves the highlight when another marker is clicked', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Girassol' }));

    expect(isHighlighted('Mandarina')).toBe(false);
    expect(isHighlighted('Girassol')).toBe(true);
  });

  it('highlights the marker of the restaurant chosen in the search', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Girassol/ }));

    expect(isHighlighted('Girassol')).toBe(true);
    expect(isHighlighted('Mandarina')).toBe(false);
  });

  it('removes the highlight when the panel closes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(isHighlighted('Mandarina')).toBe(false);
  });
});

describe('App filters', () => {
  beforeEach(() => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
  });

  function lastFilters() {
    return vi.mocked(useRestaurants).mock.lastCall?.[0];
  }

  it('requests only the restaurants in the visible area of the map', () => {
    render(<App />);

    expect(lastFilters()).toEqual({
      type: undefined,
      neighborhood: undefined,
      name: '',
      bounds: { minLat: -27.7, maxLat: -27.5, minLng: -48.6, maxLng: -48.4 },
    });
  });

  it('filters by type', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'vegan_options' },
    });

    expect(lastFilters()?.type).toBe('vegan_options');

    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: '' },
    });

    expect(lastFilters()?.type).toBeUndefined();
  });

  it('lists the neighborhoods from the API', () => {
    render(<App />);

    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual(
      expect.arrayContaining(['Todos os bairros', 'Campeche', 'Centro']),
    );
  });

  it('filters by neighborhood and moves the map to it', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });

    expect(lastFilters()?.neighborhood).toBe('Campeche');
    expect(fakeMap.fitBounds).toHaveBeenCalledWith(
      [
        [-27.68, -48.5],
        [-27.66, -48.48],
      ],
      expect.objectContaining({ maxZoom: 16 }),
    );
  });

  it('does not move the map before a neighborhood is selected', () => {
    render(<App />);

    expect(fakeMap.fitBounds).not.toHaveBeenCalled();
    expect(fakeMap.setView).not.toHaveBeenCalled();
  });

  it('moves the map back to the initial view when all neighborhoods are selected again', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });
    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: '' },
    });

    expect(lastFilters()?.neighborhood).toBeUndefined();
    expect(fakeMap.fitBounds).toHaveBeenCalledTimes(1);
    expect(fakeMap.setView).toHaveBeenCalledWith([-27.5954, -48.548], 12, {
      animate: true,
    });
  });

  it('disables the neighborhood filter when the neighborhoods fail to load', () => {
    vi.mocked(useNeighborhoods).mockReturnValue({ status: 'error' });

    render(<App />);

    expect(screen.getByLabelText<HTMLSelectElement>('Bairro').disabled).toBe(
      true,
    );
    expect(screen.getByLabelText<HTMLSelectElement>('Tipo').disabled).toBe(
      false,
    );
  });

  it('shows how many of the collapsible filters are active', () => {
    render(<App />);

    const toggle = screen.getByRole('button', { name: 'Filtros' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'fully_vegan' },
    });

    expect(
      screen
        .getByRole('button', { name: 'Filtros (1)' })
        .getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('filters the map by name only after Enter', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'mandarina' },
    });

    expect(lastFilters()?.name).toBe('');

    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'Enter' });

    expect(lastFilters()?.name).toBe('mandarina');
  });

  it('removes the name filter when the field is cleared', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'mandarina' },
    });
    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: '' },
    });

    expect(lastFilters()?.name).toBe('');
  });
});

describe('App search suggestions', () => {
  beforeEach(() => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
    vi.mocked(useRestaurantSuggestions).mockReturnValue({
      status: 'success',
      restaurants: [restaurants[1]!],
    });
  });

  function lastFilters() {
    return vi.mocked(useRestaurants).mock.lastCall?.[0];
  }

  it('moves the map to the chosen restaurant and opens its panel', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Girassol/ }));

    expect(fakeMap.fitBounds).toHaveBeenCalledWith(
      [
        [-27.5969, -48.5495],
        [-27.5969, -48.5495],
      ],
      expect.objectContaining({ maxZoom: 16 }),
    );
    expect(screen.getByRole('heading', { name: 'Girassol' })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe(
      'Girassol',
    );
  });

  it('removes an older name filter when a suggestion is chosen', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'mandarina' },
    });
    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'Enter' });

    expect(lastFilters()?.name).toBe('');
    expect(screen.getByRole('heading', { name: 'Girassol' })).toBeTruthy();
  });

  it('moves the map again when the same restaurant is chosen again', () => {
    render(<App />);

    for (let i = 0; i < 2; i++) {
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'gira' },
      });
      fireEvent.click(screen.getByRole('option', { name: /Girassol/ }));
    }

    expect(fakeMap.fitBounds).toHaveBeenCalledTimes(2);
  });

  function chooseGirassol() {
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Girassol/ }));
  }

  it('moves the map back to the initial view when the field is cleared', () => {
    render(<App />);

    chooseGirassol();
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: '' },
    });

    expect(fakeMap.setView).toHaveBeenCalledWith([-27.5954, -48.548], 12, {
      animate: true,
    });
  });

  it('moves the map back to the selected neighborhood when the field is cleared', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });
    chooseGirassol();
    fakeMap.fitBounds.mockClear();
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: '' },
    });

    expect(fakeMap.fitBounds).toHaveBeenCalledWith(
      [
        [-27.68, -48.5],
        [-27.66, -48.48],
      ],
      expect.objectContaining({ maxZoom: 16 }),
    );
    expect(fakeMap.setView).not.toHaveBeenCalled();
  });

  it('moves the map to a neighborhood selected after a suggestion', () => {
    render(<App />);

    chooseGirassol();
    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });

    expect(fakeMap.fitBounds).toHaveBeenLastCalledWith(
      [
        [-27.68, -48.5],
        [-27.66, -48.48],
      ],
      expect.objectContaining({ maxZoom: 16 }),
    );
  });

  it('does not move the map when the field is cleared without a chosen restaurant', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: '' },
    });

    expect(fakeMap.setView).not.toHaveBeenCalled();
  });
});

describe('App empty state', () => {
  beforeEach(() => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants: [],
    });
  });

  function lastFilters() {
    return vi.mocked(useRestaurants).mock.lastCall?.[0];
  }

  it('suggests zooming out when there are no restaurants and no filters', () => {
    render(<App />);

    expect(screen.getByRole('status').textContent).toContain(
      'Nenhum restaurante nesta área. Afaste o mapa para ver mais.',
    );
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull();
  });

  it('offers to clear the filters when they leave no restaurants', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'fully_vegan' },
    });
    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'mandarina' },
    });

    expect(screen.getByRole('status').textContent).toContain(
      'Nenhum restaurante nesta área com esses filtros.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(screen.getByLabelText<HTMLSelectElement>('Tipo').value).toBe('');
    expect(screen.getByLabelText<HTMLSelectElement>('Bairro').value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe('');
    expect(lastFilters()?.type).toBeUndefined();
    expect(lastFilters()?.neighborhood).toBeUndefined();
  });

  it('does not show the empty message while loading or after an error', () => {
    vi.mocked(useRestaurants).mockReturnValue({ status: 'error' });

    render(<App />);

    expect(screen.getByRole('status').textContent).not.toContain(
      'Nenhum restaurante',
    );
  });
});

// jsdom lays nothing out, so the header ends at the top of the map and the
// selected pin goes 10rem (160px) below it, above the panel, which starts
// at 320px.
describe('App on narrow screens', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(width < 40rem)',
    }));
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
    vi.mocked(useRestaurantSuggestions).mockReturnValue({
      status: 'success',
      restaurants: [restaurants[1]!],
    });
    fakeMap.panBy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('puts the chosen restaurant above the details panel', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'gira' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Girassol/ }));

    expect(fakeMap.fitBounds).toHaveBeenCalledWith(
      [
        [-27.5969, -48.5495],
        [-27.5969, -48.5495],
      ],
      expect.objectContaining({
        padding: [32, 32],
        paddingBottomRight: [32, 512],
      }),
    );
  });

  it('keeps a neighborhood in the middle of the map', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Bairro'), {
      target: { value: 'Campeche' },
    });

    expect(fakeMap.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ paddingBottomRight: expect.anything() }),
    );
  });

  it('moves a clicked pin that the details panel would cover', () => {
    fakeMap.latLngToContainerPoint.mockReturnValue({ x: 200, y: 600 });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(fakeMap.panBy).toHaveBeenCalledWith([0, 440], { animate: true });
    expect(screen.getByRole('heading', { name: 'Mandarina' })).toBeTruthy();
  });

  it('leaves a clicked pin above the details panel where it is', () => {
    fakeMap.latLngToContainerPoint.mockReturnValue({ x: 200, y: 250 });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(fakeMap.panBy).not.toHaveBeenCalled();
  });
});

describe('App on wide screens', () => {
  it('does not move a clicked pin', () => {
    vi.mocked(useRestaurants).mockReturnValue({
      status: 'success',
      restaurants,
    });
    fakeMap.panBy.mockClear();
    fakeMap.latLngToContainerPoint.mockReturnValue({ x: 200, y: 600 });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Mandarina' }));

    expect(fakeMap.panBy).not.toHaveBeenCalled();
  });
});
