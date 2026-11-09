import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';

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
}
