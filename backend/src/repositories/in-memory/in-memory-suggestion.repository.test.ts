import { describe, expect, it } from 'vitest';
import type { Suggestion } from '../../entities/suggestion.js';
import { InMemorySuggestionRepository } from './in-memory-suggestion.repository.js';

const older: Suggestion = {
  id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  text: 'Kairú, no Rio Tavares',
  status: 'ready',
  error: null,
  restaurantId: null,
  createdAt: new Date('2026-11-01T12:00:00Z'),
  updatedAt: new Date('2026-11-01T12:00:00Z'),
};

describe('InMemorySuggestionRepository', () => {
  it('creates a pending suggestion', async () => {
    const repository = new InMemorySuggestionRepository();

    const suggestion = await repository.create('Kairú, no Rio Tavares');

    expect(suggestion).toEqual({
      id: expect.any(String),
      text: 'Kairú, no Rio Tavares',
      status: 'pending',
      error: null,
      restaurantId: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(await repository.findById(suggestion.id)).toEqual(suggestion);
  });

  it('lists the newest suggestions first', async () => {
    const repository = new InMemorySuggestionRepository([older]);
    const first = await repository.create('https://instagram.com/kairu.veg');
    const second = await repository.create('Rancho Vegano, na Lagoa');

    expect((await repository.findAll()).map(({ id }) => id)).toEqual([
      second.id,
      first.id,
      older.id,
    ]);
  });

  it('returns null for an unknown id', async () => {
    const repository = new InMemorySuggestionRepository();

    expect(await repository.findById(older.id)).toBeNull();
    expect(await repository.updateStatus(older.id, 'rejected')).toBeNull();
  });

  it('updates the status and the update date', async () => {
    const repository = new InMemorySuggestionRepository([older]);

    const updated = await repository.updateStatus(older.id, 'rejected');

    expect(updated).toMatchObject({ id: older.id, status: 'rejected' });
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(
      older.updatedAt.getTime(),
    );
    expect(await repository.findById(older.id)).toEqual(updated);
  });
});
