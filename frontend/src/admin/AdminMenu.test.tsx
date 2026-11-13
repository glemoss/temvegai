// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Suggestion, SuggestionStatus } from '../api/suggestions';
import { AdminMenu } from './AdminMenu';
import type { AdminSuggestionsState } from './useAdminSuggestions';

function suggestion(id: string, status: SuggestionStatus): Suggestion {
  return {
    id,
    text: `Sugestão ${id}`,
    status,
    draft: null,
    error: null,
    restaurantId: null,
    processingStartedAt: null,
    createdAt: '2026-11-10T12:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
  };
}

function loaded(...statuses: SuggestionStatus[]): AdminSuggestionsState {
  return {
    status: 'success',
    suggestions: statuses.map((status, index) =>
      suggestion(String(index), status),
    ),
    loadedAt: Date.now(),
  };
}

function renderMenu(state: AdminSuggestionsState, path = '/admin/restaurants') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdminMenu suggestions={state} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('AdminMenu', () => {
  it('links to each module, naming it', () => {
    renderMenu(loaded());

    expect(
      screen.getByRole('link', { name: 'Restaurantes' }).getAttribute('href'),
    ).toBe('/admin/restaurants');
    expect(
      screen.getByRole('link', { name: 'Sugestões' }).getAttribute('href'),
    ).toBe('/admin/suggestions');
  });

  it('marks the open module', () => {
    renderMenu(loaded(), '/admin/suggestions/1/review');

    expect(
      screen
        .getByRole('link', { name: 'Sugestões' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen
        .getByRole('link', { name: 'Restaurantes' })
        .getAttribute('aria-current'),
    ).toBeNull();
  });

  it('counts the ready and failed suggestions over the suggestions icon', () => {
    renderMenu(
      loaded(
        'ready',
        'failed',
        'ready',
        'pending',
        'processing',
        'approved',
        'rejected',
      ),
    );

    const link = screen.getByRole('link', { name: 'Sugestões, 3 pendentes' });
    expect(link.textContent).toBe('3');
  });

  it.each<[string, AdminSuggestionsState]>([
    ['nothing is pending', loaded('pending', 'approved')],
    ['the list is loading', { status: 'loading' }],
    ['the list failed to load', { status: 'error' }],
  ])('shows no count when %s', (_, state) => {
    renderMenu(state);

    expect(screen.getByRole('link', { name: 'Sugestões' }).textContent).toBe(
      '',
    );
  });
});
