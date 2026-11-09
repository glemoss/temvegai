import { describe, expect, it } from 'vitest';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { ListSuggestionsUseCase } from './list-suggestions.use-case.js';

describe('ListSuggestionsUseCase', () => {
  it('lists the suggestions, newest first', async () => {
    const repository = new InMemorySuggestionRepository();
    const first = await repository.create('Kairú, no Rio Tavares');
    const second = await repository.create('https://instagram.com/kairu.veg');
    const useCase = new ListSuggestionsUseCase(repository);

    expect(await useCase.execute()).toEqual([second, first]);
  });

  it('returns an empty list when there are no suggestions', async () => {
    const useCase = new ListSuggestionsUseCase(
      new InMemorySuggestionRepository(),
    );

    expect(await useCase.execute()).toEqual([]);
  });
});
