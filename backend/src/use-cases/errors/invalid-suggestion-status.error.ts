import type { SuggestionStatus } from '../../entities/suggestion.js';

export class InvalidSuggestionStatusError extends Error {
  constructor(readonly status: SuggestionStatus) {
    super(`Suggestion cannot change from status ${status}`);
    this.name = 'InvalidSuggestionStatusError';
  }
}
