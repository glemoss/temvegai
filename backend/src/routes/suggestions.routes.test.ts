import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import {
  InMemoryRestaurantDraftGenerator,
  draftNamed,
} from '../services/in-memory-restaurant-draft-generator.js';
import { trustProxyHops } from '../trust-proxy.js';

const email = 'admin@temveg.ai';
const password = 'correct-horse-battery';
const unknownId = '0b8f6c2e-5d1a-4e7b-9c3f-2a6d8e4b1f70';

function suggestionWith(
  id: string,
  status: SuggestionStatus,
  createdAt: Date,
): Suggestion {
  return {
    id,
    text: 'Kairú, no Rio Tavares',
    status,
    draft: null,
    error: null,
    restaurantId: null,
    processingStartedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

const pending = suggestionWith(
  '3f1c9a7e-2b4d-4e8f-a6c1-5d7e9b0a2c4f',
  'pending',
  new Date('2026-11-02T12:00:00Z'),
);
const processing = suggestionWith(
  '9d4e2f1a-7c3b-4a5e-8f6d-1b2c3d4e5f60',
  'processing',
  new Date('2026-11-01T12:00:00Z'),
);

const ready: Suggestion = {
  ...suggestionWith(
    '7e2a4c6b-1d3f-4b5a-8c7e-9f0a1b2c3d40',
    'ready',
    new Date('2026-10-30T12:00:00Z'),
  ),
  draft: draftNamed('Kairú'),
};

const failed: Suggestion = {
  ...suggestionWith(
    '5b7d1e3f-8a2c-4d6e-9f1b-3c5a7e9d2b40',
    'failed',
    new Date('2026-10-31T12:00:00Z'),
  ),
  error: 'O Gemini respondeu com erro 503.',
};

let app: FastifyInstance;
let token: string;
let backgroundTasks: Promise<unknown>[];

async function setup(
  options: FastifyServerOptions = {},
  restaurantDraftGenerator = new InMemoryRestaurantDraftGenerator(),
) {
  backgroundTasks = [];
  const userRepository = new InMemoryUserRepository();
  await userRepository.create({ email, passwordHash: `hashed:${password}` });
  app = buildApp(
    {
      checkDatabase: async () => true,
      restaurantRepository: new InMemoryRestaurantRepository(),
      suggestionRepository: new InMemorySuggestionRepository([
        pending,
        processing,
        failed,
        ready,
      ]),
      userRepository,
      passwordHasher: {
        hash: async (plain) => `hashed:${plain}`,
        verify: async (hash, plain) => hash === `hashed:${plain}`,
      },
      restaurantDraftGenerator,
      runInBackground: (task) => {
        backgroundTasks.push(task());
      },
      jwtSecret: 'a'.repeat(32),
      cookieSecure: false,
      corsOrigin: 'http://localhost:5173',
    },
    options,
  );
  await app.ready();

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
  const cookie = response.cookies.find(({ name }) => name === 'token');
  if (!cookie) {
    throw new Error('login did not set the session cookie');
  }
  token = cookie.value;
}

// Waits for the processing started by the requests made so far.
async function settle() {
  await Promise.all(backgroundTasks);
}

function suggest(payload: object, forwardedFor?: string) {
  return app.inject({
    method: 'POST',
    url: '/suggestions',
    payload,
    ...(forwardedFor !== undefined && {
      headers: { 'x-forwarded-for': forwardedFor },
    }),
  });
}

function listSuggestions() {
  return app.inject({
    method: 'GET',
    url: '/suggestions',
    cookies: { token },
  });
}

function reject(id: string) {
  return app.inject({
    method: 'POST',
    url: `/suggestions/${id}/reject`,
    cookies: { token },
  });
}

const restaurantBody = {
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'rio tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: null,
  website: null,
  instagram: 'kairu.veg',
  openingHours: null,
};

function approve(id: string, payload: object = restaurantBody) {
  return app.inject({
    method: 'POST',
    url: `/suggestions/${id}/approve`,
    payload,
    cookies: { token },
  });
}

function processAgain(id: string) {
  return app.inject({
    method: 'POST',
    url: `/suggestions/${id}/process`,
    cookies: { token },
  });
}

async function findSuggestion(id: string): Promise<Suggestion | undefined> {
  return (await listSuggestions())
    .json()
    .suggestions.find((suggestion: Suggestion) => suggestion.id === id);
}

afterEach(async () => {
  await app.close();
});

describe('POST /suggestions', () => {
  it('creates a pending suggestion without a session', async () => {
    await setup();

    const response = await suggest({ text: '  Kairú, no Rio Tavares  ' });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      suggestion: {
        id: expect.any(String),
        text: 'Kairú, no Rio Tavares',
        status: 'pending',
        draft: null,
        error: null,
        restaurantId: null,
        processingStartedAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('accepts a text with 300 characters', async () => {
    await setup();

    const response = await suggest({ text: 'a'.repeat(300) });

    expect(response.statusCode).toBe(201);
  });

  it.each([
    ['an empty text', { text: '' }],
    ['a text with only spaces', { text: '   ' }],
    ['a text over 300 characters', { text: 'a'.repeat(301) }],
    ['a missing text', {}],
    ['a text that is not a string', { text: 42 }],
    ['an unknown field', { text: 'Kairú', status: 'approved' }],
  ])('responds 400 for %s', async (_case, payload) => {
    await setup();

    const response = await suggest(payload);

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('responds 429 after 5 suggestions', async () => {
    await setup();

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await suggest({ text: `Restaurante ${attempt}` });
      expect(response.statusCode).toBe(201);
    }
    const response = await suggest({ text: 'Restaurante 6' });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Muitas tentativas. Tente novamente mais tarde.',
      },
    });
    expect((await listSuggestions()).json().suggestions).toHaveLength(9);
  });

  it('counts each X-Forwarded-For origin separately behind a trusted proxy', async () => {
    await setup({ trustProxy: trustProxyHops(1) });

    for (let attempt = 1; attempt <= 5; attempt++) {
      await suggest({ text: `Restaurante ${attempt}` }, '203.0.113.1');
    }

    expect((await suggest({ text: 'Kairú' }, '203.0.113.1')).statusCode).toBe(
      429,
    );
    expect((await suggest({ text: 'Kairú' }, '203.0.113.2')).statusCode).toBe(
      201,
    );
  });
});

describe('processing after POST /suggestions', () => {
  it('drafts the restaurant after answering the visitor', async () => {
    const generator = new InMemoryRestaurantDraftGenerator();
    await setup({}, generator);

    const response = await suggest({ text: 'Kairú, no Rio Tavares' });
    await settle();

    expect(generator.texts).toEqual(['Kairú, no Rio Tavares']);
    expect(await findSuggestion(response.json().suggestion.id)).toMatchObject({
      status: 'ready',
      draft: draftNamed('Kairú, no Rio Tavares'),
      error: null,
      processingStartedAt: expect.any(String),
    });
  });

  it('stores the failure of the AI', async () => {
    await setup(
      {},
      new InMemoryRestaurantDraftGenerator('O Gemini respondeu com erro 429.'),
    );

    const response = await suggest({ text: 'Kairú' });
    await settle();

    expect(await findSuggestion(response.json().suggestion.id)).toMatchObject({
      status: 'failed',
      draft: null,
      error: 'O Gemini respondeu com erro 429.',
    });
  });
});

describe('admin routes without a session', () => {
  it.each([
    { method: 'GET', url: '/suggestions' },
    { method: 'POST', url: `/suggestions/${pending.id}/reject` },
    { method: 'POST', url: `/suggestions/${ready.id}/approve` },
    { method: 'POST', url: `/suggestions/${failed.id}/process` },
  ] as const)('$method $url responds 401', async ({ method, url }) => {
    await setup();

    const response = await app.inject({ method, url });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Não autenticado.' },
    });
    expect(
      (await listSuggestions())
        .json()
        .suggestions.map(({ status }: Suggestion) => status),
    ).toEqual(['pending', 'processing', 'failed', 'ready']);
  });
});

describe('GET /suggestions', () => {
  it('lists the suggestions, newest first', async () => {
    await setup();
    const created = (await suggest({ text: 'Rancho Vegano' })).json();

    const response = await listSuggestions();

    expect(response.statusCode).toBe(200);
    expect(response.json().suggestions.map(({ id }: Suggestion) => id)).toEqual(
      [created.suggestion.id, pending.id, processing.id, failed.id, ready.id],
    );
  });
});

describe('POST /suggestions/:id/reject', () => {
  it('rejects the suggestion', async () => {
    await setup();

    const response = await reject(pending.id);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      suggestion: {
        ...pending,
        status: 'rejected',
        createdAt: pending.createdAt.toISOString(),
        updatedAt: expect.any(String),
      },
    });
  });

  it('responds 409 for a suggestion that cannot be rejected', async () => {
    await setup();

    const response = await reject(processing.id);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_SUGGESTION_STATUS',
        message: 'A sugestão não pode ser alterada no status atual.',
      },
    });
  });

  it('responds 404 for an unknown suggestion', async () => {
    await setup();

    const response = await reject(unknownId);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'SUGGESTION_NOT_FOUND',
        message: 'Sugestão não encontrada.',
      },
    });
  });

  it('responds 400 for an invalid id', async () => {
    await setup();

    const response = await reject('not-a-uuid');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

describe('POST /suggestions/:id/approve', () => {
  it('creates the restaurant and approves the suggestion', async () => {
    await setup();

    const response = await approve(ready.id);

    expect(response.statusCode).toBe(201);
    const { suggestion, restaurant } = response.json();
    expect(restaurant).toMatchObject({
      ...restaurantBody,
      id: expect.any(String),
      neighborhood: 'Rio Tavares',
    });
    expect(suggestion).toMatchObject({
      id: ready.id,
      status: 'approved',
      restaurantId: restaurant.id,
    });
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/restaurants/${restaurant.id}`,
        })
      ).statusCode,
    ).toBe(200);
    expect(await findSuggestion(ready.id)).toMatchObject({
      status: 'approved',
      restaurantId: restaurant.id,
    });
  });

  it('responds 400 for an invalid restaurant', async () => {
    await setup();

    const response = await approve(ready.id, { ...restaurantBody, name: '' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'name', message: 'Campo obrigatório' }],
      },
    });
    expect((await findSuggestion(ready.id))?.status).toBe('ready');
  });

  it('responds 409 for a suggestion that is not ready', async () => {
    await setup();

    const response = await approve(failed.id);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: { code: 'INVALID_SUGGESTION_STATUS' },
    });
    expect(
      (await app.inject({ method: 'GET', url: '/restaurants' })).json()
        .restaurants,
    ).toEqual([]);
  });

  it('responds 404 for an unknown suggestion', async () => {
    await setup();

    const response = await approve(unknownId);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'SUGGESTION_NOT_FOUND' },
    });
  });

  it('responds 400 for an invalid id', async () => {
    await setup();

    const response = await approve('not-a-uuid');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

describe('POST /suggestions/:id/process', () => {
  it('puts a failed suggestion back in the queue and processes it', async () => {
    await setup();

    const response = await processAgain(failed.id);

    expect(response.statusCode).toBe(202);
    expect(response.json().suggestion).toMatchObject({
      id: failed.id,
      status: 'pending',
    });

    await settle();

    expect(await findSuggestion(failed.id)).toMatchObject({
      status: 'ready',
      draft: draftNamed(failed.text),
      error: null,
    });
  });

  it('processes again a suggestion stuck in processing', async () => {
    await setup();

    const response = await processAgain(processing.id);
    await settle();

    expect(response.statusCode).toBe(202);
    expect(await findSuggestion(processing.id)).toMatchObject({
      status: 'ready',
    });
  });

  it('responds 409 for a suggestion that cannot be processed again', async () => {
    await setup();

    const response = await processAgain(pending.id);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: { code: 'INVALID_SUGGESTION_STATUS' },
    });
  });

  it('responds 404 for an unknown suggestion', async () => {
    await setup();

    const response = await processAgain(unknownId);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'SUGGESTION_NOT_FOUND' },
    });
  });

  it('responds 400 for an invalid id', async () => {
    await setup();

    const response = await processAgain('not-a-uuid');

    expect(response.statusCode).toBe(400);
  });
});
