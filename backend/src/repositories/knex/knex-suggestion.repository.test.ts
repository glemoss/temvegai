import { describe, expect, it } from 'vitest';
import { draftNamed } from '../../services/in-memory-restaurant-draft-generator.js';
import {
  toSuggestion,
  type SuggestionRow,
} from './knex-suggestion.repository.js';

const createdAt = new Date('2026-11-09T12:00:00Z');
const updatedAt = new Date('2026-11-09T13:00:00Z');

const row: SuggestionRow = {
  id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  text: 'Kairú, no Rio Tavares',
  status: 'pending',
  draft: null,
  error: null,
  restaurant_id: null,
  processing_started_at: null,
  created_at: createdAt,
  updated_at: updatedAt,
};

describe('toSuggestion', () => {
  it('maps the row to camelCase fields', () => {
    expect(
      toSuggestion({
        ...row,
        status: 'approved',
        restaurant_id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
      }),
    ).toEqual({
      id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
      text: 'Kairú, no Rio Tavares',
      status: 'approved',
      draft: null,
      error: null,
      restaurantId: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
      processingStartedAt: null,
      createdAt,
      updatedAt,
    });
  });

  it('keeps the failure reason', () => {
    expect(
      toSuggestion({ ...row, status: 'failed', error: 'Cota esgotada' }),
    ).toMatchObject({ status: 'failed', error: 'Cota esgotada' });
  });

  it('keeps the draft and the processing start', () => {
    const draft = draftNamed('Kairú');
    const processingStartedAt = new Date('2026-11-09T12:30:00Z');

    expect(
      toSuggestion({
        ...row,
        status: 'ready',
        draft,
        processing_started_at: processingStartedAt,
      }),
    ).toMatchObject({ status: 'ready', draft, processingStartedAt });
  });
});
