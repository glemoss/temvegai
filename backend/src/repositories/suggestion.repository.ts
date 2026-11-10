import type {
  RestaurantDraft,
  Suggestion,
  SuggestionStatus,
} from '../entities/suggestion.js';

export type ProcessingResult =
  | { status: 'ready'; draft: RestaurantDraft }
  | { status: 'failed'; error: string };

export interface SuggestionRepository {
  create(text: string): Promise<Suggestion>;
  // Newest first.
  findAll(): Promise<Suggestion[]>;
  findById(id: string): Promise<Suggestion | null>;
  // Returns null when there is no suggestion with the given id.
  updateStatus(
    id: string,
    status: SuggestionStatus,
  ): Promise<Suggestion | null>;
  // Moves a pending suggestion to processing in a single step, so two
  // processes never take the same suggestion. Returns null when it is not
  // pending.
  startProcessing(id: string): Promise<Suggestion | null>;
  // Stores the outcome of a suggestion in processing. Returns null when it is
  // not in processing.
  finishProcessing(
    id: string,
    result: ProcessingResult,
  ): Promise<Suggestion | null>;
  countProcessingStartedSince(since: Date): Promise<number>;
}
