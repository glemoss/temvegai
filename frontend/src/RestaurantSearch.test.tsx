// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Restaurant } from './api/restaurants';
import { RestaurantSearch } from './RestaurantSearch';
import { useRestaurantSuggestions } from './useRestaurantSuggestions';

// Each test sets the suggestions the hook returns instead of making a
// request.
vi.mock('./useRestaurantSuggestions', () => ({
  useRestaurantSuggestions: vi.fn(),
}));

function restaurant(name: string, neighborhood: string): Restaurant {
  return {
    id: name,
    name,
    description: null,
    type: 'fully_vegan',
    address: 'Rua das Flores, 100',
    neighborhood,
    latitude: -27.661458,
    longitude: -48.499222,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  };
}

const mandarina = restaurant('Mandarina', 'Campeche');
const manjericao = restaurant('Manjericão', 'Centro');

const onSubmit = vi.fn();
const onSelect = vi.fn();

// Holds the typed text, as the App does.
function Search() {
  const [value, setValue] = useState('');
  return (
    <RestaurantSearch
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      onSelect={onSelect}
    />
  );
}

function field() {
  return screen.getByRole('combobox');
}

function type(value: string) {
  fireEvent.change(field(), { target: { value } });
}

function options() {
  return screen.queryAllByRole('option');
}

beforeEach(() => {
  vi.mocked(useRestaurantSuggestions).mockReturnValue({
    status: 'success',
    restaurants: [mandarina, manjericao],
  });
  onSubmit.mockClear();
  onSelect.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('RestaurantSearch', () => {
  it('shows no suggestions before typing', () => {
    render(<Search />);

    expect(options()).toEqual([]);
    expect(field().getAttribute('aria-expanded')).toBe('false');
  });

  it('suggests restaurants with their neighborhoods while typing', () => {
    render(<Search />);

    type('man');

    expect(options().map((option) => option.textContent)).toEqual([
      'MandarinaCampeche',
      'ManjericãoCentro',
    ]);
    expect(field().getAttribute('aria-expanded')).toBe('true');
  });

  it('hides the suggestions when the field is cleared', () => {
    render(<Search />);

    type('man');
    type('');

    expect(options()).toEqual([]);
  });

  it('selects a suggestion with the mouse', () => {
    render(<Search />);

    type('man');
    fireEvent.click(screen.getByRole('option', { name: /Manjericão/ }));

    expect(onSelect).toHaveBeenCalledWith(manjericao);
    expect(options()).toEqual([]);
  });

  it('moves through the suggestions with the arrow keys and selects with Enter', () => {
    render(<Search />);

    type('man');
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    fireEvent.keyDown(field(), { key: 'ArrowDown' });

    const highlighted = screen.getByRole('option', { selected: true });
    expect(highlighted.textContent).toBe('ManjericãoCentro');
    expect(field().getAttribute('aria-activedescendant')).toBe(highlighted.id);

    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(mandarina);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('searches the map with Enter when no suggestion is highlighted', () => {
    render(<Search />);

    type('man');
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(options()).toEqual([]);
  });

  it('closes the suggestions with Escape and keeps the text', () => {
    const onDocumentKeyDown = vi.fn();
    document.addEventListener('keydown', onDocumentKeyDown);
    render(<Search />);

    type('man');
    fireEvent.keyDown(field(), { key: 'Escape' });

    expect(options()).toEqual([]);
    expect(screen.getByRole<HTMLInputElement>('combobox').value).toBe('man');
    // The details panel listens for Esc on the document.
    expect(onDocumentKeyDown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDocumentKeyDown);
  });

  it('opens the suggestions again with the down arrow', () => {
    render(<Search />);

    type('man');
    fireEvent.keyDown(field(), { key: 'Escape' });
    fireEvent.keyDown(field(), { key: 'ArrowDown' });

    expect(options()).toHaveLength(2);
  });

  it('closes the suggestions when the field loses the focus', () => {
    render(<Search />);

    type('man');
    fireEvent.blur(field());

    expect(options()).toEqual([]);
  });

  it('says when no restaurant has the name', () => {
    vi.mocked(useRestaurantSuggestions).mockReturnValue({
      status: 'success',
      restaurants: [],
    });
    render(<Search />);

    type('xyz');

    expect(screen.getByText('Nenhum restaurante com esse nome.')).toBeTruthy();
    expect(field().getAttribute('aria-expanded')).toBe('false');
  });

  it('says when the suggestions could not be loaded', () => {
    vi.mocked(useRestaurantSuggestions).mockReturnValue({ status: 'error' });
    render(<Search />);

    type('man');

    expect(screen.getByText('Não foi possível buscar sugestões.')).toBeTruthy();
  });
});
