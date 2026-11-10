import type { RestaurantDraft } from '../entities/suggestion.js';

export interface RestaurantDraftGenerator {
  // Researches the restaurant the visitor described, by name or link. Throws
  // RestaurantDraftGenerationError when there is no draft to give.
  generate(text: string): Promise<RestaurantDraft>;
}

// The message is stored with the failed suggestion and shown to the admin,
// so it must say what went wrong without secrets.
export class RestaurantDraftGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RestaurantDraftGenerationError';
  }
}
