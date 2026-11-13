import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UnauthenticatedError,
  ValidationError,
  type Restaurant,
  type RestaurantInput,
} from './restaurants';
import {
  approveSuggestion,
  fetchSuggestions,
  rejectSuggestion,
  retrySuggestion,
  SuggestionNotFoundError,
  SuggestionStatusError,
  type Suggestion,
} from './suggestions';

vi.mock('../config', () => ({ config: { apiUrl: 'http://api.test' } }));

const suggestion: Suggestion = {
  id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  text: 'Kairú, no Rio Tavares',
  status: 'ready',
  draft: {
    name: 'Kairú',
    description: null,
    type: 'fully_vegan',
    address: null,
    neighborhood: 'Rio Tavares',
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  },
  error: null,
  restaurantId: null,
  processingStartedAt: '2026-11-10T12:00:00.000Z',
  createdAt: '2026-11-10T12:00:00.000Z',
  updatedAt: '2026-11-10T12:01:00.000Z',
};

const input: RestaurantInput = {
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: null,
  openingHours: null,
};

const restaurant: Restaurant = {
  ...input,
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
};

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSuggestions', () => {
  it('calls GET /suggestions sending cookies and returns the list', async () => {
    const fetchMock = stubFetch(Response.json({ suggestions: [suggestion] }));
    const signal = new AbortController().signal;

    await expect(fetchSuggestions(signal)).resolves.toEqual([suggestion]);
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/suggestions', {
      signal,
      credentials: 'include',
    });
  });

  it('throws UnauthenticatedError on 401', async () => {
    stubFetch(Response.json({}, { status: 401 }));

    await expect(fetchSuggestions()).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('fails on other error statuses', async () => {
    stubFetch(Response.json({}, { status: 500 }));

    await expect(fetchSuggestions()).rejects.toThrow(
      'GET /suggestions respondeu 500',
    );
  });
});

describe('approveSuggestion', () => {
  it('posts the restaurant to /suggestions/:id/approve sending cookies', async () => {
    const approved = {
      ...suggestion,
      status: 'approved',
      restaurantId: restaurant.id,
    };
    const fetchMock = stubFetch(
      Response.json({ suggestion: approved, restaurant }, { status: 201 }),
    );

    await expect(approveSuggestion(suggestion.id, input)).resolves.toEqual({
      suggestion: approved,
      restaurant,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/suggestions/${suggestion.id}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'include',
      },
    );
  });

  it('throws ValidationError with the details on 400', async () => {
    const details = [{ field: 'name', message: 'Campo obrigatório' }];
    stubFetch(
      Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'x', details } },
        { status: 400 },
      ),
    );

    const error = await approveSuggestion(suggestion.id, input).catch(
      (reason) => reason,
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(details);
  });
});

describe.each([
  { name: 'rejectSuggestion', action: rejectSuggestion, path: 'reject' },
  { name: 'retrySuggestion', action: retrySuggestion, path: 'process' },
])('$name', ({ action, path }) => {
  it(`posts to /suggestions/:id/${path} and returns the suggestion`, async () => {
    const fetchMock = stubFetch(Response.json({ suggestion }));

    await expect(action(suggestion.id)).resolves.toEqual(suggestion);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/suggestions/${suggestion.id}/${path}`,
      { method: 'POST', credentials: 'include' },
    );
  });

  it.each([
    [401, UnauthenticatedError],
    [404, SuggestionNotFoundError],
    [409, SuggestionStatusError],
  ])('throws on %i', async (status, ErrorClass) => {
    stubFetch(Response.json({ error: {} }, { status }));

    await expect(action(suggestion.id)).rejects.toBeInstanceOf(ErrorClass);
  });

  it('throws a generic error on other failures', async () => {
    stubFetch(Response.json({}, { status: 500 }));

    await expect(action(suggestion.id)).rejects.toThrow(
      `POST /suggestions/${suggestion.id}/${path} respondeu 500`,
    );
  });
});
