import { describe, expect, it } from 'vitest';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { CreateSuggestionUseCase } from './create-suggestion.use-case.js';

describe('CreateSuggestionUseCase', () => {
  it('creates a pending suggestion with the text', async () => {
    const repository = new InMemorySuggestionRepository();
    const useCase = new CreateSuggestionUseCase(repository);

    const suggestion = await useCase.execute('Kairú, no Rio Tavares');

    expect(suggestion).toMatchObject({
      text: 'Kairú, no Rio Tavares',
      status: 'pending',
    });
    expect(await repository.findById(suggestion.id)).toEqual(suggestion);
  });
});
