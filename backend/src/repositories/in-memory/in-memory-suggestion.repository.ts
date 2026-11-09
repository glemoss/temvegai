import { randomUUID } from 'node:crypto';
import type {
  Suggestion,
  SuggestionStatus,
} from '../../entities/suggestion.js';
import type { SuggestionRepository } from '../suggestion.repository.js';

export class InMemorySuggestionRepository implements SuggestionRepository {
  private readonly suggestions: Suggestion[];

  constructor(suggestions: Suggestion[] = []) {
    this.suggestions = suggestions.map((suggestion) => ({ ...suggestion }));
  }

  async create(text: string): Promise<Suggestion> {
    const now = new Date();
    const suggestion: Suggestion = {
      id: randomUUID(),
      text,
      status: 'pending',
      error: null,
      restaurantId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.suggestions.push(suggestion);
    return { ...suggestion };
  }

  // Sorting keeps the insertion order on equal dates, so the reverse puts the
  // last created first among suggestions created in the same millisecond.
  async findAll(): Promise<Suggestion[]> {
    return [...this.suggestions]
      .reverse()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((suggestion) => ({ ...suggestion }));
  }

  async findById(id: string): Promise<Suggestion | null> {
    const suggestion = this.suggestions.find((stored) => stored.id === id);
    return suggestion ? { ...suggestion } : null;
  }

  async updateStatus(
    id: string,
    status: SuggestionStatus,
  ): Promise<Suggestion | null> {
    const suggestion = this.suggestions.find((stored) => stored.id === id);
    if (!suggestion) {
      return null;
    }

    suggestion.status = status;
    suggestion.updatedAt = new Date();
    return { ...suggestion };
  }
}
