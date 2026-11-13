// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Coordinates } from '../api/geocoding';
import type { Restaurant } from '../api/restaurants';
import {
  approveSuggestion,
  fetchSuggestions,
  rejectSuggestion,
  retrySuggestion,
  SuggestionStatusError,
  type Suggestion,
  type SuggestionStatus,
} from '../api/suggestions';
import { RequireAdmin } from './RequireAdmin';
import { ReviewSuggestion } from './ReviewSuggestion';
import { SuggestionsPage } from './SuggestionsPage';
import { useCurrentAdmin } from './useCurrentAdmin';

vi.mock('../api/suggestions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/suggestions')>()),
  fetchSuggestions: vi.fn(),
  approveSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
  retrySuggestion: vi.fn(),
}));
vi.mock('../api/geocoding', () => ({
  geocodeAddress: vi.fn(() => new Promise(() => {})),
  reverseGeocode: vi.fn(() => new Promise(() => {})),
}));
vi.mock('./useCurrentAdmin', () => ({ useCurrentAdmin: vi.fn() }));
vi.mock('../useNeighborhoods', () => ({
  useNeighborhoods: () => ({ status: 'loading' }),
}));
vi.mock('./LocationPicker', () => ({
  LocationPicker: ({
    onChange,
  }: {
    onChange: (location: Coordinates) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange({ latitude: -27.661458, longitude: -48.499222 })}
    >
      Marcar no mapa
    </button>
  ),
}));

function suggestion(
  id: string,
  text: string,
  status: SuggestionStatus,
  overrides: Partial<Suggestion> = {},
): Suggestion {
  return {
    id,
    text,
    status,
    draft: null,
    error: null,
    restaurantId: null,
    processingStartedAt: null,
    createdAt: '2026-11-10T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const ready = suggestion('1', 'Kairú, no Rio Tavares', 'ready', {
  draft: {
    name: 'Kairú',
    description: null,
    type: 'fully_vegan',
    address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
    neighborhood: 'Rio Tavares',
    phone: null,
    website: null,
    instagram: 'kairu.veg',
    openingHours: null,
  },
});
const failed = suggestion('2', 'https://instagram.com/janelabar', 'failed', {
  error: 'O Gemini respondeu com erro 503.',
});
const pending = suggestion('3', 'Rancho Vegano', 'pending');
const processing = suggestion('4', 'Dona Jovem', 'processing');
const stuck = suggestion('5', 'Bugio', 'processing', {
  updatedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
});
const approved = suggestion('6', 'Mandarina', 'approved', {
  restaurantId: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
});
const rejected = suggestion('7', 'Lanchonete X', 'rejected');

const kairu: Restaurant = {
  id: '9d4e2f1a-7c3b-4a5e-8f6d-1b2c3d4e5f60',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: 'kairu.veg',
  openingHours: null,
};

// jsdom has no ResizeObserver, which the radio buttons use.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderPanel(path = '/admin/suggestions') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<p>Tela de login</p>} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route path="suggestions" element={<SuggestionsPage />}>
            <Route index element={null} />
            <Route path=":id/review" element={<ReviewSuggestion />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

async function rowOf(text: string) {
  const cell = await screen.findByRole('cell', { name: text });
  const row = cell.closest('tr');
  if (!row) throw new Error(`no row for ${text}`);
  return within(row);
}

function confirmation() {
  return screen.queryByRole('alertdialog', { name: 'Recusar sugestão?' });
}

function modal() {
  return screen.queryByRole('dialog', { name: 'Revisar sugestão' });
}

beforeEach(() => {
  vi.mocked(fetchSuggestions)
    .mockReset()
    .mockResolvedValue([
      ready,
      failed,
      pending,
      processing,
      stuck,
      approved,
      rejected,
    ]);
  vi.mocked(approveSuggestion).mockReset();
  vi.mocked(rejectSuggestion).mockReset();
  vi.mocked(retrySuggestion).mockReset();
  vi.mocked(useCurrentAdmin).mockReturnValue({
    status: 'authenticated',
    admin: { id: '1', email: 'admin@example.com' },
  });
});

afterEach(() => {
  cleanup();
});

describe('suggestions section', () => {
  it('shows the status, the text and the draft of each suggestion', async () => {
    renderPanel();

    const kairuRow = await rowOf('Kairú, no Rio Tavares');
    expect(kairuRow.getByText('Pronta para revisar')).toBeTruthy();
    expect(
      kairuRow.getByText('Kairú · 100% vegano · Rio Tavares'),
    ).toBeTruthy();

    const failedRow = await rowOf(
      'https://instagram.com/janelabar O Gemini respondeu com erro 503.',
    );
    expect(failedRow.getByText('Falhou')).toBeTruthy();

    expect((await rowOf('Rancho Vegano')).getByText('Na fila')).toBeTruthy();
    expect((await rowOf('Mandarina')).getByText('Aprovada')).toBeTruthy();
    expect((await rowOf('Lanchonete X')).getByText('Recusada')).toBeTruthy();
  });

  it('offers only the actions each status allows', async () => {
    renderPanel();
    await rowOf('Kairú, no Rio Tavares');

    const actionsOf = (text: string) =>
      [
        screen.queryByRole('link', { name: `Revisar ${text}` }) && 'revisar',
        screen.queryByRole('button', { name: `Processar de novo ${text}` }) &&
          'processar',
        screen.queryByRole('button', { name: `Recusar ${text}` }) && 'recusar',
      ].filter(Boolean);

    expect(actionsOf('Kairú, no Rio Tavares')).toEqual(['revisar', 'recusar']);
    expect(actionsOf('https://instagram.com/janelabar')).toEqual([
      'processar',
      'recusar',
    ]);
    expect(actionsOf('Rancho Vegano')).toEqual(['recusar']);
    expect(actionsOf('Dona Jovem')).toEqual([]);
    expect(actionsOf('Bugio')).toEqual(['processar']);
    expect(actionsOf('Mandarina')).toEqual([]);
    expect(actionsOf('Lanchonete X')).toEqual([]);
  });

  it('shows a message when there are no suggestions', async () => {
    vi.mocked(fetchSuggestions).mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText('Nenhuma sugestão recebida.')).toBeTruthy();
  });

  it('shows an error when the suggestions cannot be loaded', async () => {
    vi.mocked(fetchSuggestions).mockRejectedValue(new Error('offline'));
    renderPanel();

    expect(
      await screen.findByText(
        'Não foi possível carregar as sugestões. Tente novamente mais tarde.',
      ),
    ).toBeTruthy();
  });
});

describe('rejecting a suggestion', () => {
  it('asks for confirmation, rejects and reloads the list', async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Recusar Rancho Vegano' }),
    );
    expect(confirmation()?.textContent).toContain('“Rancho Vegano”');
    vi.mocked(rejectSuggestion).mockResolvedValue({
      ...pending,
      status: 'rejected',
    });
    vi.mocked(fetchSuggestions).mockResolvedValue([
      { ...pending, status: 'rejected' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(await screen.findByText('Sugestão recusada.')).toBeTruthy();
    expect(confirmation()).toBeNull();
    await waitFor(async () =>
      expect((await rowOf('Rancho Vegano')).getByText('Recusada')).toBeTruthy(),
    );
    expect(rejectSuggestion).toHaveBeenCalledExactlyOnceWith('3');
  });

  it('updates the count on the menu', async () => {
    renderPanel();
    expect(
      await screen.findByRole('link', { name: 'Sugestões, 2 pendentes' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Recusar Kairú, no Rio Tavares' }),
    );
    vi.mocked(rejectSuggestion).mockResolvedValue({
      ...ready,
      status: 'rejected',
    });
    vi.mocked(fetchSuggestions).mockResolvedValue([
      { ...ready, status: 'rejected' },
      failed,
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(
      await screen.findByRole('link', { name: 'Sugestões, 1 pendente' }),
    ).toBeTruthy();
  });

  it('rejects nothing when cancelled', async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Recusar Rancho Vegano' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(confirmation()).toBeNull();
    expect(rejectSuggestion).not.toHaveBeenCalled();
  });

  it('closes with a notice and reloads when the suggestion changed', async () => {
    vi.mocked(rejectSuggestion).mockRejectedValue(new SuggestionStatusError());
    renderPanel();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Recusar Rancho Vegano' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(
      await screen.findByText(
        'Oops, essa sugestão mudou enquanto isso. A lista foi atualizada.',
      ),
    ).toBeTruthy();
    expect(confirmation()).toBeNull();
    expect(fetchSuggestions).toHaveBeenCalledTimes(2);
  });

  it('shows an error in the confirmation when the rejection fails', async () => {
    vi.mocked(rejectSuggestion).mockRejectedValue(new Error('offline'));
    renderPanel();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Recusar Rancho Vegano' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(
      await screen.findByText(
        'Não foi possível recusar a sugestão. Tente novamente mais tarde.',
      ),
    ).toBeTruthy();
    expect(confirmation()).not.toBeNull();
  });
});

describe('processing a suggestion again', () => {
  it('puts a failed suggestion back in the queue and reloads the list', async () => {
    vi.mocked(retrySuggestion).mockResolvedValue({
      ...failed,
      status: 'pending',
    });
    renderPanel();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Processar de novo https://instagram.com/janelabar',
      }),
    );

    expect(
      await screen.findByText('Sugestão de volta na fila para processar.'),
    ).toBeTruthy();
    expect(retrySuggestion).toHaveBeenCalledExactlyOnceWith('2');
    expect(fetchSuggestions).toHaveBeenCalledTimes(2);
  });

  it('shows a notice when processing again fails', async () => {
    vi.mocked(retrySuggestion).mockRejectedValue(new Error('offline'));
    renderPanel();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Processar de novo Bugio' }),
    );

    expect(
      await screen.findByText(
        'Não foi possível processar a sugestão de novo. Tente novamente mais tarde.',
      ),
    ).toBeTruthy();
  });
});

describe('reviewing a suggestion', () => {
  it('opens the form filled with the draft, without the location', async () => {
    renderPanel();

    fireEvent.click(
      await screen.findByRole('link', {
        name: 'Revisar Kairú, no Rio Tavares',
      }),
    );

    expect(modal()?.textContent).toContain(
      'Sugestão do visitante: “Kairú, no Rio Tavares”',
    );
    expect(screen.getByLabelText('Nome')).toHaveProperty('value', 'Kairú');
    expect(screen.getByLabelText('Bairro')).toHaveProperty(
      'value',
      'Rio Tavares',
    );
    expect(screen.getByLabelText('100% vegano')).toHaveProperty(
      'ariaChecked',
      'true',
    );
    expect(screen.getByLabelText('Latitude')).toHaveProperty('value', '');
  });

  it('approves, closes and reloads the suggestions', async () => {
    vi.mocked(approveSuggestion).mockResolvedValue({
      suggestion: { ...ready, status: 'approved', restaurantId: kairu.id },
      restaurant: kairu,
    });
    renderPanel('/admin/suggestions/1/review');
    await screen.findByLabelText('Nome');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));

    expect(
      await screen.findByText('Sugestão aprovada. “Kairú” está no mapa.'),
    ).toBeTruthy();
    await waitFor(() => expect(modal()).toBeNull());
    expect(approveSuggestion).toHaveBeenCalledExactlyOnceWith(
      '1',
      expect.objectContaining({
        name: 'Kairú',
        neighborhood: 'Rio Tavares',
        latitude: -27.661458,
        longitude: -48.499222,
      }),
    );
    expect(fetchSuggestions).toHaveBeenCalledTimes(2);
  });

  it('closes with a notice when the suggestion was already decided', async () => {
    vi.mocked(approveSuggestion).mockRejectedValue(new SuggestionStatusError());
    renderPanel('/admin/suggestions/1/review');
    await screen.findByLabelText('Nome');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));

    expect(
      await screen.findByText(
        'Oops, essa sugestão mudou enquanto isso. A lista foi atualizada.',
      ),
    ).toBeTruthy();
    await waitFor(() => expect(modal()).toBeNull());
  });

  it('says so when the suggestion has no draft to review', async () => {
    renderPanel('/admin/suggestions/3/review');

    expect(
      await screen.findByText(
        'Sugestão não encontrada ou sem rascunho para revisar.',
      ),
    ).toBeTruthy();
  });
});
