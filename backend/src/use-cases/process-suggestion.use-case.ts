import type { Suggestion } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import {
  RestaurantDraftGenerationError,
  type RestaurantDraftGenerator,
} from '../services/restaurant-draft-generator.js';

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
      return this.suggestionRepository.finishProcessing(id, {
        status: 'failed',
        error: 'Limite diário de processamentos atingido.',
      });
    }

    try {
      const draft = await this.draftGenerator.generate(suggestion.text);
      return await this.suggestionRepository.finishProcessing(id, {
        status: 'ready',
        draft,
      });
    } catch (error) {
      if (!(error instanceof RestaurantDraftGenerationError)) {
        throw error;
      }
      return this.suggestionRepository.finishProcessing(id, {
        status: 'failed',
        error: error.message,
      });
    }
  }
}
