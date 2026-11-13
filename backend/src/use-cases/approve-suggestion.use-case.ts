import type { Restaurant } from '../entities/restaurant.js';
import type { Suggestion } from '../entities/suggestion.js';
import type { RestaurantData } from '../repositories/restaurant.repository.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import type { CreateRestaurantUseCase } from './create-restaurant.use-case.js';
import { InvalidSuggestionStatusError } from './errors/invalid-suggestion-status.error.js';
import { SuggestionNotFoundError } from './errors/suggestion-not-found.error.js';

export interface ApprovedSuggestion {
  suggestion: Suggestion;
  restaurant: Restaurant;
}

// Creates the restaurant the admin reviewed from the draft of a ready
// suggestion, which becomes approved and points to it. The restaurant is
// created like any other, so it follows the same rules.
export class ApproveSuggestionUseCase {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly createRestaurant: CreateRestaurantUseCase,
  ) {}

  async execute(id: string, data: RestaurantData): Promise<ApprovedSuggestion> {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) {
      throw new SuggestionNotFoundError();
    }
    if (suggestion.status !== 'ready') {
      throw new InvalidSuggestionStatusError(suggestion.status);
    }

    const restaurant = await this.createRestaurant.execute(data);
    const approved = await this.suggestionRepository.approve(id, restaurant.id);
    if (!approved) {
      throw new InvalidSuggestionStatusError(suggestion.status);
    }
    return { suggestion: approved, restaurant };
  }
}
