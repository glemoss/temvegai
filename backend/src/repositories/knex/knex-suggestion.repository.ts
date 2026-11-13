import type { Knex } from 'knex';
import type {
  RestaurantDraft,
  Suggestion,
  SuggestionStatus,
} from '../../entities/suggestion.js';
import type {
  ProcessingResult,
  SuggestionRepository,
} from '../suggestion.repository.js';

export interface SuggestionRow {
  id: string;
  text: string;
  status: SuggestionStatus;
  draft: RestaurantDraft | null;
  error: string | null;
  restaurant_id: string | null;
  processing_started_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    text: row.text,
    status: row.status,
    draft: row.draft,
    error: row.error,
    restaurantId: row.restaurant_id,
    processingStartedAt: row.processing_started_at,
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

  // The status in the where clause makes the update the lock: when two
  // processes race, only the first finds the suggestion still pending.
  async startProcessing(id: string): Promise<Suggestion | null> {
    const [row] = await this.db<SuggestionRow>('suggestions')
      .where({ id, status: 'pending' })
      .update({
        status: 'processing',
        error: null,
        processing_started_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      })
      .returning('*');
    return row ? toSuggestion(row as SuggestionRow) : null;
  }

  // jsonb is written as JSON text, so the driver does not have to guess how
  // to send it.
  async finishProcessing(
    id: string,
    result: ProcessingResult,
  ): Promise<Suggestion | null> {
    const [row] = await this.db('suggestions')
      .where({ id, status: 'processing' })
      .update({
        status: result.status,
        draft: result.status === 'ready' ? JSON.stringify(result.draft) : null,
        error: result.status === 'failed' ? result.error : null,
        updated_at: this.db.fn.now(),
      })
      .returning('*');
    return row ? toSuggestion(row as SuggestionRow) : null;
  }

  async approve(id: string, restaurantId: string): Promise<Suggestion | null> {
    const [row] = await this.db<SuggestionRow>('suggestions')
      .where({ id, status: 'ready' })
      .update({
        status: 'approved',
        restaurant_id: restaurantId,
        updated_at: this.db.fn.now(),
      })
      .returning('*');
    return row ? toSuggestion(row as SuggestionRow) : null;
  }

  async countProcessingStartedSince(since: Date): Promise<number> {
    const result = await this.db('suggestions')
      .where('processing_started_at', '>=', since)
      .count<{ count: string }>({ count: '*' })
      .first();
    return Number(result?.count ?? 0);
  }
}
