import type { RestaurantDraft } from '../entities/suggestion.js';

// The draft and the city the restaurant is in, which the draft does not
// keep: it only serves to check that the restaurant is in the area of the
// map. Null when the AI did not find the city.
export interface GeneratedDraft {
  draft: RestaurantDraft;
  city: string | null;
}

export interface RestaurantDraftGenerator {
  // Researches the restaurant the visitor described, by name or link. Throws
  // RestaurantDraftGenerationError when there is no draft to give.
  generate(text: string): Promise<GeneratedDraft>;
}

// The message is stored with the failed suggestion and shown to the admin,
// so it must say what went wrong without secrets.
export class RestaurantDraftGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RestaurantDraftGenerationError';
  }
}
