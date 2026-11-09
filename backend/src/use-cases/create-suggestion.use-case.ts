import type { Suggestion } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';

export class CreateSuggestionUseCase {
  constructor(private readonly suggestionRepository: SuggestionRepository) {}

  async execute(text: string): Promise<Suggestion> {
    return this.suggestionRepository.create(text);
  }
}
