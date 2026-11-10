import { describe, expect, it } from 'vitest';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import {
  InMemoryRestaurantDraftGenerator,
  draftNamed,
} from '../services/in-memory-restaurant-draft-generator.js';
import {
  DAILY_PROCESSING_LIMIT,
  ProcessSuggestionUseCase,
} from './process-suggestion.use-case.js';

const id = '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f';

function suggestionWith(
  status: SuggestionStatus,
  processingStartedAt: Date | null = null,
  suggestionId = id,
): Suggestion {
  return {
    id: suggestionId,
    text: 'Kairú, no Rio Tavares',
    status,
    draft: null,
    error: null,
    restaurantId: null,
    processingStartedAt,
    createdAt: new Date('2026-11-01T12:00:00Z'),
    updatedAt: new Date('2026-11-01T12:00:00Z'),
  };
}

// Suggestions that started processing at the given time, filling the count
// of the daily limit.
function startedAt(date: Date, count: number): Suggestion[] {
  return Array.from({ length: count }, (_, index) =>
    suggestionWith(
      'ready',
      date,
      `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    ),
  );
}

describe('ProcessSuggestionUseCase', () => {
  it('stores the draft of a pending suggestion', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
    ]);
    const generator = new InMemoryRestaurantDraftGenerator();
    const useCase = new ProcessSuggestionUseCase(repository, generator);

    const processed = await useCase.execute(id);

    expect(generator.texts).toEqual(['Kairú, no Rio Tavares']);
    expect(processed).toMatchObject({
      status: 'ready',
      draft: draftNamed('Kairú, no Rio Tavares'),
      error: null,
      processingStartedAt: expect.any(Date),
    });
    expect(await repository.findById(id)).toEqual(processed);
  });

  it('stores the failure message of the generator', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
    ]);
    const useCase = new ProcessSuggestionUseCase(
      repository,
      new InMemoryRestaurantDraftGenerator(
        'O Gemini não encontrou o restaurante.',
      ),
    );

    const processed = await useCase.execute(id);

    expect(processed).toMatchObject({
      status: 'failed',
      draft: null,
      error: 'O Gemini não encontrou o restaurante.',
    });
  });

  it('leaves the suggestion in processing on an unexpected error', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
    ]);
    const useCase = new ProcessSuggestionUseCase(repository, {
      generate: async () => {
        throw new TypeError('bug');
      },
    });

    await expect(useCase.execute(id)).rejects.toThrow('bug');
    expect((await repository.findById(id))?.status).toBe('processing');
  });

  it.each(['processing', 'ready', 'failed', 'approved', 'rejected'] as const)(
    'ignores a %s suggestion',
    async (status) => {
      const repository = new InMemorySuggestionRepository([
        suggestionWith(status),
      ]);
      const generator = new InMemoryRestaurantDraftGenerator();
      const useCase = new ProcessSuggestionUseCase(repository, generator);

      expect(await useCase.execute(id)).toBeNull();
      expect(generator.texts).toEqual([]);
      expect((await repository.findById(id))?.status).toBe(status);
    },
  );

  it('fails without calling the AI once the daily limit is reached', async () => {
    const now = new Date();
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
      ...startedAt(now, DAILY_PROCESSING_LIMIT),
    ]);
    const generator = new InMemoryRestaurantDraftGenerator();
    const useCase = new ProcessSuggestionUseCase(
      repository,
      generator,
      () => now,
    );

    const processed = await useCase.execute(id);

    expect(generator.texts).toEqual([]);
    expect(processed).toMatchObject({
      status: 'failed',
      error: 'Limite diário de processamentos atingido.',
    });
  });

  it('processes the last suggestion within the limit', async () => {
    const now = new Date();
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
      ...startedAt(now, DAILY_PROCESSING_LIMIT - 1),
    ]);
    const useCase = new ProcessSuggestionUseCase(
      repository,
      new InMemoryRestaurantDraftGenerator(),
      () => now,
    );

    expect((await useCase.execute(id))?.status).toBe('ready');
  });

  // 03:00 UTC is midnight in Florianópolis.
  it('counts the day from midnight in Florianópolis', async () => {
    const repository = new InMemorySuggestionRepository([
      suggestionWith('pending'),
      ...startedAt(new Date('2026-11-09T02:59:59Z'), DAILY_PROCESSING_LIMIT),
    ]);
    const useCase = new ProcessSuggestionUseCase(
      repository,
      new InMemoryRestaurantDraftGenerator(),
      () => new Date('2026-11-09T03:00:00Z'),
    );

    expect((await useCase.execute(id))?.status).toBe('ready');
  });
});
