import { describe, expect, it } from 'vitest';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import type { RestaurantData } from '../repositories/restaurant.repository.js';
import { draftNamed } from '../services/in-memory-restaurant-draft-generator.js';
import { ApproveSuggestionUseCase } from './approve-suggestion.use-case.js';
import { CreateRestaurantUseCase } from './create-restaurant.use-case.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';

function suggestionWith(status: SuggestionStatus): Suggestion {
  return {
    id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
    text: 'Kairú, no Rio Tavares',
    status,
    draft: status === 'ready' ? draftNamed('Kairú') : null,
    error: null,
    restaurantId: null,
    processingStartedAt: null,
    createdAt: new Date('2026-11-01T12:00:00Z'),
    updatedAt: new Date('2026-11-01T12:00:00Z'),
  };
}

const data: RestaurantData = {
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'rio tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: 'kairu.veg',
  openingHours: null,
};

function setup(suggestion: Suggestion) {
  const suggestionRepository = new InMemorySuggestionRepository([suggestion]);
  const restaurantRepository = new InMemoryRestaurantRepository();
  const useCase = new ApproveSuggestionUseCase(
    suggestionRepository,
    new CreateRestaurantUseCase(restaurantRepository),
  );
  return { suggestionRepository, restaurantRepository, useCase };
}

describe('ApproveSuggestionUseCase', () => {
  it('creates the restaurant and approves the suggestion', async () => {
    const suggestion = suggestionWith('ready');
    const { suggestionRepository, restaurantRepository, useCase } =
      setup(suggestion);

    const result = await useCase.execute(suggestion.id, data);

    expect(result.restaurant).toMatchObject({
      ...data,
      neighborhood: 'Rio Tavares',
    });
    expect(result.suggestion).toMatchObject({
      id: suggestion.id,
      status: 'approved',
      restaurantId: result.restaurant.id,
    });
    expect(await suggestionRepository.findById(suggestion.id)).toEqual(
      result.suggestion,
    );
    expect(await restaurantRepository.findById(result.restaurant.id)).toEqual(
      result.restaurant,
    );
  });

  it.each(['pending', 'processing', 'failed', 'approved', 'rejected'] as const)(
    'refuses to approve a %s suggestion',
    async (status) => {
      const suggestion = suggestionWith(status);
      const { suggestionRepository, restaurantRepository, useCase } =
        setup(suggestion);

      await expect(useCase.execute(suggestion.id, data)).rejects.toThrow(
        InvalidSuggestionStatusError,
      );
      expect((await suggestionRepository.findById(suggestion.id))?.status).toBe(
        status,
      );
      expect(await restaurantRepository.findAll({})).toEqual([]);
    },
  );

  it('throws when the suggestion does not exist', async () => {
    const { restaurantRepository, useCase } = setup(suggestionWith('ready'));

    await expect(
      useCase.execute('0b8f6c2e-5d1a-4e7b-9c3f-2a6d8e4b1f70', data),
    ).rejects.toThrow(SuggestionNotFoundError);
    expect(await restaurantRepository.findAll({})).toEqual([]);
  });
});
