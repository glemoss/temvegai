import type { Suggestion } from '../entities/suggestion.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import {
  RestaurantDraftGenerationError,
  type GeneratedDraft,
  type RestaurantDraftGenerator,
} from '../services/restaurant-draft-generator.js';
import {
  findRegisteredRestaurant,
  isInFlorianopolis,
} from './suggestion-checks.js';

// Keeps the AI bill predictable: each processing costs tokens and a few
// paid Google searches.
export const DAILY_PROCESSING_LIMIT = 20;

// Florianópolis is three hours behind UTC all year, since Brazil dropped
// daylight saving time in 2019.
const UTC_OFFSET_MS = -3 * 60 * 60 * 1000;

function startOfDayInFlorianopolis(now: Date): Date {
  const local = new Date(now.getTime() + UTC_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - UTC_OFFSET_MS);
}

export class ProcessSuggestionUseCase {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly restaurantRepository: RestaurantRepository,
    private readonly draftGenerator: RestaurantDraftGenerator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  // Returns null when the suggestion is not pending, as when another process
  // already took it.
  async execute(id: string): Promise<Suggestion | null> {
    const suggestion = await this.suggestionRepository.startProcessing(id);
    if (!suggestion) {
      return null;
    }

    // The count includes this suggestion, which has just started.
    const startedToday =
      await this.suggestionRepository.countProcessingStartedSince(
        startOfDayInFlorianopolis(this.now()),
      );
    if (startedToday > DAILY_PROCESSING_LIMIT) {
      return this.fail(id, 'Limite diário de processamentos atingido.');
    }

    let generated: GeneratedDraft;
    try {
      generated = await this.draftGenerator.generate(suggestion.text);
    } catch (error) {
      if (!(error instanceof RestaurantDraftGenerationError)) {
        throw error;
      }
      return this.fail(id, error.message);
    }

    const { draft, city } = generated;
    if (!isInFlorianopolis(city)) {
      return this.fail(
        id,
        `O restaurante fica em ${city}, fora de Florianópolis.`,
      );
    }

    const registered = findRegisteredRestaurant(
      draft,
      await this.restaurantRepository.findAll({}),
    );
    if (registered) {
      return this.fail(
        id,
        `Já está no mapa como “${registered.name}” (${registered.neighborhood}).`,
      );
    }

    return this.suggestionRepository.finishProcessing(id, {
      status: 'ready',
      draft,
    });
  }

  private fail(id: string, error: string): Promise<Suggestion | null> {
    return this.suggestionRepository.finishProcessing(id, {
      status: 'failed',
      error,
    });
  }
}
