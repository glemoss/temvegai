import type { RestaurantDraft } from '../entities/suggestion.js';
import {
  RestaurantDraftGenerationError,
  type RestaurantDraftGenerator,
} from './restaurant-draft-generator.js';

// Stands in for the AI in tests: drafts a restaurant named after the text,
// or fails with the given message.
export class InMemoryRestaurantDraftGenerator implements RestaurantDraftGenerator {
  readonly texts: string[] = [];

  constructor(private readonly failure?: string) {}

  async generate(text: string): Promise<RestaurantDraft> {
    this.texts.push(text);
    if (this.failure !== undefined) {
      throw new RestaurantDraftGenerationError(this.failure);
    }
    return draftNamed(text);
  }
}

export function draftNamed(name: string): RestaurantDraft {
  return {
    name,
    description: null,
    type: 'fully_vegan',
    address: null,
    neighborhood: null,
    phone: null,
    website: null,
    instagram: null,
    openingHours: null,
  };
}
