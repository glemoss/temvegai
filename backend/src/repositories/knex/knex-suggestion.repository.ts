import type { Knex } from 'knex';
import type {
  Suggestion,
  SuggestionStatus,
} from '../../entities/suggestion.js';
import type { SuggestionRepository } from '../suggestion.repository.js';

export interface SuggestionRow {
  id: string;
  text: string;
  status: SuggestionStatus;
  draft: unknown;
  error: string | null;
  restaurant_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// The draft only becomes part of a Suggestion when the AI starts filling it.
export function toSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    text: row.text,
    status: row.status,
    error: row.error,
    restaurantId: row.restaurant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class KnexSuggestionRepository implements SuggestionRepository {
  constructor(private readonly db: Knex) {}

  async create(text: string): Promise<Suggestion> {
    const [row] = await this.db<SuggestionRow>('suggestions')
      .insert({ text })
      .returning('*');
    return toSuggestion(row as SuggestionRow);
  }

  async findAll(): Promise<Suggestion[]> {
    const rows = await this.db<SuggestionRow>('suggestions').orderBy(
      'created_at',
      'desc',
    );
    return rows.map(toSuggestion);
  }

  async findById(id: string): Promise<Suggestion | null> {
    const row = await this.db<SuggestionRow>('suggestions')
      .where({ id })
      .first();
    return row ? toSuggestion(row) : null;
  }

  async updateStatus(
    id: string,
    status: SuggestionStatus,
  ): Promise<Suggestion | null> {
    const [row] = await this.db<SuggestionRow>('suggestions')
      .where({ id })
      .update({ status, updated_at: this.db.fn.now() })
      .returning('*');
    return row ? toSuggestion(row as SuggestionRow) : null;
  }
}
