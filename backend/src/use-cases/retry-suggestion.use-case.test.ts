import { describe, expect, it } from 'vitest';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';
import {
  RetrySuggestionUseCase,
  STALE_PROCESSING_MS,
} from './retry-suggestion.use-case.js';

const id = '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f';
const updatedAt = new Date('2026-11-09T12:00:00Z');

function suggestionWith(status: SuggestionStatus): Suggestion {
  return {
    id,
    text: 'Kairú, no Rio Tavares',
    status,
    draft: null,
    error: status === 'failed' ? 'O Gemini respondeu com erro 503.' : null,
    restaurantId: null,
    processingStartedAt: null,
    createdAt: updatedAt,
    updatedAt,
  };
}

function useCaseAt(repository: InMemorySuggestionRepository, now: Date) {
  return new RetrySuggestionUseCase(repository, () => now);
}

describe('RetrySuggestionUseCase', () => {
  it('puts a failed suggestion back as pending', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('failed'),
    ]);

    const retried = await useCaseAt(repository, updatedAt).execute(id);

    expect(retried).toMatchObject({ id, status: 'pending' });
    expect((await repository.findById(id))?.status).toBe('pending');
  });

  it('puts back a suggestion stuck in processing', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('processing'),
    ]);
    const now = new Date(updatedAt.getTime() + STALE_PROCESSING_MS + 1);

    const retried = await useCaseAt(repository, now).execute(id);

    expect(retried.status).toBe('pending');
  });

  it('refuses a suggestion still within the processing time', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('processing'),
    ]);
    const now = new Date(updatedAt.getTime() + STALE_PROCESSING_MS);

    await expect(useCaseAt(repository, now).execute(id)).rejects.toThrow(
      InvalidSuggestionStatusError,
    );
    expect((await repository.findById(id))?.status).toBe('processing');
  });

  it.each(['pending', 'ready', 'approved', 'rejected'] as const)(
    'refuses a %s suggestion',
    async (status) => {
      const repository = new InMemorySuggestionRepository([
        suggestionWith(status),
      ]);

      await expect(
        useCaseAt(repository, updatedAt).execute(id),
      ).rejects.toThrow(InvalidSuggestionStatusError);
      expect((await repository.findById(id))?.status).toBe(status);
    },
  );

  it('throws when the suggestion does not exist', async () => {
    const repository = new InMemorySuggestionRepository();

    await expect(useCaseAt(repository, updatedAt).execute(id)).rejects.toThrow(
      SuggestionNotFoundError,
    );
  });
});
