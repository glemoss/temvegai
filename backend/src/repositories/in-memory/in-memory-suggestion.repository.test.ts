import { describe, expect, it } from 'vitest';
import type { Suggestion } from '../../entities/suggestion.js';
import { draftNamed } from '../../services/in-memory-restaurant-draft-generator.js';
import { InMemorySuggestionRepository } from './in-memory-suggestion.repository.js';

const older: Suggestion = {
  id: '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  text: 'Kairú, no Rio Tavares',
  status: 'ready',
  draft: null,
  error: null,
  restaurantId: null,
  processingStartedAt: null,
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
      draft: null,
      error: null,
      restaurantId: null,
      processingStartedAt: null,
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

  it('starts processing only a pending suggestion', async () => {
    const repository = new InMemorySuggestionRepository([older]);
    const created = await repository.create('Kairú');

    const started = await repository.startProcessing(created.id);

    expect(started).toMatchObject({
      status: 'processing',
      processingStartedAt: expect.any(Date),
    });
    expect(await repository.startProcessing(created.id)).toBeNull();
    expect(await repository.startProcessing(older.id)).toBeNull();
  });

  it('finishes only a suggestion in processing', async () => {
    const repository = new InMemorySuggestionRepository([older]);
    const created = await repository.create('Kairú');
    const draft = draftNamed('Kairú');

    expect(
      await repository.finishProcessing(created.id, { status: 'ready', draft }),
    ).toBeNull();

    await repository.startProcessing(created.id);
    const finished = await repository.finishProcessing(created.id, {
      status: 'ready',
      draft,
    });

    expect(finished).toMatchObject({ status: 'ready', draft, error: null });
    expect(await repository.findById(created.id)).toEqual(finished);
  });

  it('stores the error of a failed processing', async () => {
    const repository = new InMemorySuggestionRepository();
    const created = await repository.create('Kairú');
    await repository.startProcessing(created.id);

    expect(
      await repository.finishProcessing(created.id, {
        status: 'failed',
        error: 'Cota esgotada',
      }),
    ).toMatchObject({ status: 'failed', draft: null, error: 'Cota esgotada' });
  });

  it('counts the suggestions started since a date', async () => {
    const repository = new InMemorySuggestionRepository([
      { ...older, processingStartedAt: new Date('2026-11-01T12:00:00Z') },
    ]);
    const created = await repository.create('Kairú');
    await repository.startProcessing(created.id);

    expect(
      await repository.countProcessingStartedSince(
        new Date('2026-11-01T12:00:00Z'),
      ),
    ).toBe(2);
    expect(
      await repository.countProcessingStartedSince(
        new Date('2026-11-01T12:00:01Z'),
      ),
    ).toBe(1);
  });
});
