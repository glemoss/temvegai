import { describe, expect, it } from 'vitest';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';
import { RejectSuggestionUseCase } from './reject-suggestion.use-case.js';

function suggestionWith(status: SuggestionStatus): Suggestion {
  return {
    id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
    text: 'Kairú, no Rio Tavares',
    status,
    error: null,
    restaurantId: null,
    createdAt: new Date('2026-11-01T12:00:00Z'),
    updatedAt: new Date('2026-11-01T12:00:00Z'),
  };
}

describe('RejectSuggestionUseCase', () => {
  it.each(['pending', 'ready', 'failed'] as const)(
    'rejects a %s suggestion',
    async (status) => {
      const suggestion = suggestionWith(status);
      const repository = new InMemorySuggestionRepository([suggestion]);
      const useCase = new RejectSuggestionUseCase(repository);

      const rejected = await useCase.execute(suggestion.id);

      expect(rejected).toMatchObject({ id: suggestion.id, status: 'rejected' });
      expect((await repository.findById(suggestion.id))?.status).toBe(
        'rejected',
      );
    },
  );

  it.each(['processing', 'approved', 'rejected'] as const)(
    'refuses to reject a %s suggestion',
    async (status) => {
      const suggestion = suggestionWith(status);
      const repository = new InMemorySuggestionRepository([suggestion]);
      const useCase = new RejectSuggestionUseCase(repository);

      await expect(useCase.execute(suggestion.id)).rejects.toThrow(
        InvalidSuggestionStatusError,
      );
      expect((await repository.findById(suggestion.id))?.status).toBe(status);
    },
  );

  it('throws when the suggestion does not exist', async () => {
    const useCase = new RejectSuggestionUseCase(
      new InMemorySuggestionRepository(),
    );

    await expect(
      useCase.execute('3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f'),
    ).rejects.toThrow(SuggestionNotFoundError);
  });
});
