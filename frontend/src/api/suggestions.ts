import { config } from '../config';
import {
  UnauthenticatedError,
  ValidationError,
  type FieldError,
  type Restaurant,
  type RestaurantInput,
  type RestaurantType,
  type WeeklyHours,
} from './restaurants';

export type SuggestionStatus =
  'pending' | 'processing' | 'ready' | 'failed' | 'approved' | 'rejected';

// The restaurant form as filled by the AI, without the coordinates; only
// the name is sure to be there.
export interface RestaurantDraft {
  name: string;
  description: string | null;
  type: RestaurantType | null;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  openingHours: WeeklyHours | null;
}

// Dates come from the API as ISO text.
export interface Suggestion {
  id: string;
  text: string;
  status: SuggestionStatus;
  draft: RestaurantDraft | null;
  error: string | null;
  restaurantId: string | null;
  processingStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// The suggestion is not in the API anymore.
export class SuggestionNotFoundError extends Error {
  constructor() {
    super('Sugestão não encontrada.');
    this.name = 'SuggestionNotFoundError';
  }
}

// The suggestion changed status since the list was loaded, as when the AI
// finished it or it was already decided.
export class SuggestionStatusError extends Error {
  constructor() {
    super('A sugestão mudou de status.');
    this.name = 'SuggestionStatusError';
  }
}

export async function fetchSuggestions(
  signal?: AbortSignal,
): Promise<Suggestion[]> {
  const response = await fetch(`${config.apiUrl}/suggestions`, {
    signal,
    credentials: 'include',
  });

  if (response.status === 401) throw new UnauthenticatedError();
  if (!response.ok) {
    throw new Error(`GET /suggestions respondeu ${response.status}`);
  }

  const body = (await response.json()) as { suggestions: Suggestion[] };
  return body.suggestions;
}

// Posts to an action of a suggestion and returns the body of the answer.
async function postAction<T>(
  id: string,
  action: 'approve' | 'reject' | 'process',
  input?: RestaurantInput,
): Promise<T> {
  const path = `/suggestions/${encodeURIComponent(id)}/${action}`;
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: 'POST',
    ...(input && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
    credentials: 'include',
  });

  if (response.status === 401) throw new UnauthenticatedError();
  if (response.status === 400) {
    const body = (await response.json()) as {
      error: { details?: FieldError[] };
    };
    throw new ValidationError(body.error.details ?? []);
  }
  if (response.status === 404) throw new SuggestionNotFoundError();
  if (response.status === 409) throw new SuggestionStatusError();
  if (!response.ok) {
    throw new Error(`POST ${path} respondeu ${response.status}`);
  }

  return (await response.json()) as T;
}

// Creates the restaurant reviewed from the draft and approves the
// suggestion.
export function approveSuggestion(
  id: string,
  input: RestaurantInput,
): Promise<{ suggestion: Suggestion; restaurant: Restaurant }> {
  return postAction(id, 'approve', input);
}

export async function rejectSuggestion(id: string): Promise<Suggestion> {
  const body = await postAction<{ suggestion: Suggestion }>(id, 'reject');
  return body.suggestion;
}

// Puts the suggestion back in the queue; the AI works on it after the
// answer, so it comes back pending.
export async function retrySuggestion(id: string): Promise<Suggestion> {
  const body = await postAction<{ suggestion: Suggestion }>(id, 'process');
  return body.suggestion;
}
