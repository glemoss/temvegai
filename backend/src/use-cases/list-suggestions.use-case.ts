import type { Suggestion } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';

export class ListSuggestionsUseCase {
  constructor(private readonly suggestionRepository: SuggestionRepository) {}

  async execute(): Promise<Suggestion[]> {
    return this.suggestionRepository.findAll();
  }
}
