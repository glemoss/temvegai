import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { Suggestion, SuggestionStatus } from '../entities/suggestion.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
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
    error: null,
    restaurantId: null,
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

let app: FastifyInstance;
let token: string;

async function setup(options: FastifyServerOptions = {}) {
  const userRepository = new InMemoryUserRepository();
  await userRepository.create({ email, passwordHash: `hashed:${password}` });
  app = buildApp(
    {
      checkDatabase: async () => true,
      restaurantRepository: new InMemoryRestaurantRepository(),
      suggestionRepository: new InMemorySuggestionRepository([
        pending,
        processing,
      ]),
      userRepository,
      passwordHasher: {
        hash: async (plain) => `hashed:${plain}`,
        verify: async (hash, plain) => hash === `hashed:${plain}`,
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
        error: null,
        restaurantId: null,
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
    expect((await listSuggestions()).json().suggestions).toHaveLength(7);
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

describe('admin routes without a session', () => {
  it.each([
    { method: 'GET', url: '/suggestions' },
    { method: 'POST', url: `/suggestions/${pending.id}/reject` },
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
    ).toEqual(['pending', 'processing']);
  });
});

describe('GET /suggestions', () => {
  it('lists the suggestions, newest first', async () => {
    await setup();
    const created = (await suggest({ text: 'Rancho Vegano' })).json();

    const response = await listSuggestions();

    expect(response.statusCode).toBe(200);
    expect(response.json().suggestions.map(({ id }: Suggestion) => id)).toEqual(
      [created.suggestion.id, pending.id, processing.id],
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
