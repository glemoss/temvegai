import type { Suggestion } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';

// A processing that runs longer than the Vercel function can live (300
// seconds) was cut in the middle and will not finish.
export const STALE_PROCESSING_MS = 10 * 60 * 1000;

// Puts a suggestion back in the queue, as pending, for the AI to process it
// again.
export class RetrySuggestionUseCase {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(id: string): Promise<Suggestion> {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) {
      throw new SuggestionNotFoundError();
    }
    if (!this.canRetry(suggestion)) {
      throw new InvalidSuggestionStatusError(suggestion.status);
    }

    const pending = await this.suggestionRepository.updateStatus(id, 'pending');
    if (!pending) {
      throw new SuggestionNotFoundError();
    }
    return pending;
  }

  private canRetry({ status, updatedAt }: Suggestion): boolean {
    if (status === 'failed') {
      return true;
    }
    return (
      status === 'processing' &&
      this.now().getTime() - updatedAt.getTime() > STALE_PROCESSING_MS
    );
  }
}
