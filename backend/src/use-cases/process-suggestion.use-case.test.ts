import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../entities/restaurant.js';
import type {
  RestaurantDraft,
  Suggestion,
  SuggestionStatus,
} from '../entities/suggestion.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
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
    const useCase = new ProcessSuggestionUseCase(
      repository,
      new InMemoryRestaurantRepository(),
      generator,
    );

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
      new InMemoryRestaurantRepository(),
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
    const useCase = new ProcessSuggestionUseCase(
      repository,
      new InMemoryRestaurantRepository(),
      {
        generate: async () => {
          throw new TypeError('bug');
        },
      },
    );

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
      const useCase = new ProcessSuggestionUseCase(
        repository,
        new InMemoryRestaurantRepository(),
        generator,
      );

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
      new InMemoryRestaurantRepository(),
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
      new InMemoryRestaurantRepository(),
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
      new InMemoryRestaurantRepository(),
      new InMemoryRestaurantDraftGenerator(),
      () => new Date('2026-11-09T03:00:00Z'),
    );

    expect((await useCase.execute(id))?.status).toBe('ready');
  });

  describe('checks on the draft', () => {
    const kairu: Restaurant = {
      id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
      name: 'Kairú',
      description: null,
      type: 'fully_vegan',
      address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
      neighborhood: 'Rio Tavares',
      latitude: -27.661458,
      longitude: -48.499222,
      phone: '48991242935',
      website: 'https://kairu.com.br',
      instagram: 'kairu.veg',
      openingHours: null,
      createdAt: new Date('2026-10-14T12:00:00Z'),
      updatedAt: new Date('2026-10-14T12:00:00Z'),
    };

    // A draft of a restaurant that is not registered.
    const draft: RestaurantDraft = {
      name: 'Rancho Vegano',
      description: null,
      type: 'fully_vegan',
      address: 'Rua das Flores, 100',
      neighborhood: 'Campeche',
      phone: '4833334444',
      website: 'https://ranchovegano.com.br',
      instagram: 'ranchovegano',
      openingHours: null,
    };

    function process(generated: RestaurantDraft, city: string | null) {
      const repository = new InMemorySuggestionRepository([
        suggestionWith('pending'),
      ]);
      const useCase = new ProcessSuggestionUseCase(
        repository,
        new InMemoryRestaurantRepository([kairu]),
        { generate: async () => ({ draft: generated, city }) },
      );
      return useCase.execute(id);
    }

    it.each(['Florianópolis', 'florianopolis', 'Florianópolis - SC', null])(
      'accepts a restaurant in %s',
      async (city) => {
        expect(await process(draft, city)).toMatchObject({
          status: 'ready',
          draft,
        });
      },
    );

    it('fails a restaurant outside Florianópolis', async () => {
      expect(await process(draft, 'São José')).toMatchObject({
        status: 'failed',
        draft: null,
        error: 'O restaurante fica em São José, fora de Florianópolis.',
      });
    });

    it.each<[string, Partial<RestaurantDraft>]>([
      ['the Instagram', { instagram: 'Kairu.Veg' }],
      ['the site', { website: 'http://www.kairu.com.br/' }],
      ['the phone', { phone: '48991242935' }],
      [
        'the name in the neighborhood',
        { name: 'kairu', neighborhood: 'rio tavares' },
      ],
    ])('fails a restaurant already registered, by %s', async (_, fields) => {
      expect(
        await process({ ...draft, ...fields }, 'Florianópolis'),
      ).toMatchObject({
        status: 'failed',
        error: 'Já está no mapa como “Kairú” (Rio Tavares).',
      });
    });

    it('accepts a restaurant with a registered name in another neighborhood', async () => {
      expect(
        await process(
          { ...draft, name: 'Kairú', neighborhood: 'Centro' },
          'Florianópolis',
        ),
      ).toMatchObject({ status: 'ready' });
    });

    it('accepts a draft without contacts nor neighborhood', async () => {
      expect(
        await process(
          {
            ...draft,
            name: 'Kairú',
            neighborhood: null,
            phone: null,
            website: null,
            instagram: null,
          },
          'Florianópolis',
        ),
      ).toMatchObject({ status: 'ready' });
    });
  });
});
