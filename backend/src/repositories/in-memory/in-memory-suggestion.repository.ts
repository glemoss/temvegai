import { randomUUID } from 'node:crypto';
import type {
  Suggestion,
  SuggestionStatus,
} from '../../entities/suggestion.js';
import type {
  ProcessingResult,
  SuggestionRepository,
} from '../suggestion.repository.js';

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
      draft: null,
      error: null,
      restaurantId: null,
      processingStartedAt: null,
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

  async startProcessing(id: string): Promise<Suggestion | null> {
    const suggestion = this.suggestions.find(
      (stored) => stored.id === id && stored.status === 'pending',
    );
    if (!suggestion) {
      return null;
    }

    const now = new Date();
    suggestion.status = 'processing';
    suggestion.error = null;
    suggestion.processingStartedAt = now;
    suggestion.updatedAt = now;
    return { ...suggestion };
  }

  async finishProcessing(
    id: string,
    result: ProcessingResult,
  ): Promise<Suggestion | null> {
    const suggestion = this.suggestions.find(
      (stored) => stored.id === id && stored.status === 'processing',
    );
    if (!suggestion) {
      return null;
    }

    suggestion.status = result.status;
    suggestion.draft = result.status === 'ready' ? result.draft : null;
    suggestion.error = result.status === 'failed' ? result.error : null;
    suggestion.updatedAt = new Date();
    return { ...suggestion };
  }

  async countProcessingStartedSince(since: Date): Promise<number> {
    return this.suggestions.filter(
      ({ processingStartedAt }) =>
        processingStartedAt !== null && processingStartedAt >= since,
    ).length;
  }
}
