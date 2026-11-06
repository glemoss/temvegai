// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserLocationControl } from './UserLocationControl';
import type { UserLocationState } from './useUserLocation';

// Leaflet needs a real browser to lay out the map, so the control puts its
// element straight in the page, where Leaflet would put it in the corner.
const removed = vi.hoisted(() => vi.fn());
vi.mock('leaflet', () => ({
  DomEvent: { disableClickPropagation: vi.fn() },
  Control: class {
    onAdd?: () => HTMLElement;
    private element?: HTMLElement;
    constructor(readonly options: { position: string }) {}
    addTo() {
      this.element = this.onAdd?.();
      if (this.element) {
        this.element.dataset.position = this.options.position;
        document.body.append(this.element);
      }
      return this;
    }
    remove() {
      this.element?.remove();
      removed();
      return this;
    }
  },
}));
vi.mock('react-leaflet', () => ({ useMap: () => ({}) }));

afterEach(() => {
  cleanup();
});

function renderControl(
  status: UserLocationState['status'],
  onLocate = vi.fn(),
) {
  return render(<UserLocationControl status={status} onLocate={onLocate} />);
}

describe('UserLocationControl', () => {
  it('puts the button in the bottom left corner, above the zoom buttons', () => {
    renderControl('idle');

    const button = screen.getByRole('button', { name: 'Minha localização' });
    expect(
      button.closest('[data-position]')?.getAttribute('data-position'),
    ).toBe('bottomleft');
  });

  it('asks for the location when clicked', () => {
    const onLocate = vi.fn();
    renderControl('idle', onLocate);

    fireEvent.click(screen.getByRole('button', { name: 'Minha localização' }));

    expect(onLocate).toHaveBeenCalledOnce();
  });

  it.each([
    ['idle', ''],
    ['located', ''],
    ['locating', 'Procurando sua localização…'],
    [
      'denied',
      'Permita o acesso à localização no navegador para ver onde você está.',
    ],
    ['unavailable', 'Não foi possível encontrar sua localização.'],
    ['unsupported', 'Seu navegador não informa a localização.'],
  ] as const)('shows the message for %s', (status, message) => {
    renderControl(status);

    expect(screen.getByRole('status').textContent).toBe(message);
  });

  it('marks the button busy while locating', () => {
    renderControl('locating');

    expect(
      screen
        .getByRole('button', { name: 'Minha localização' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('removes the control from the map when unmounted', () => {
    const { unmount } = renderControl('idle');

    unmount();

    expect(removed).toHaveBeenCalled();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
