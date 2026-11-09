import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';

// A suggestion can be rejected before, after or without the AI draft, but not
// while the AI works on it nor once the admin has decided.
const REJECTABLE: readonly SuggestionStatus[] = ['pending', 'ready', 'failed'];

export class RejectSuggestionUseCase {
  constructor(private readonly suggestionRepository: SuggestionRepository) {}

  async execute(id: string): Promise<Suggestion> {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) {
      throw new SuggestionNotFoundError();
    }
    if (!REJECTABLE.includes(suggestion.status)) {
      throw new InvalidSuggestionStatusError(suggestion.status);
    }

    const rejected = await this.suggestionRepository.updateStatus(
      id,
      'rejected',
    );
    if (!rejected) {
      throw new SuggestionNotFoundError();
    }
    return rejected;
  }
}
