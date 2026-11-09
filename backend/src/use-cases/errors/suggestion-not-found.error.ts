export class SuggestionNotFoundError extends Error {
  constructor() {
    super('Suggestion not found');
    this.name = 'SuggestionNotFoundError';
  }
}
