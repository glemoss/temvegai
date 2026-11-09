import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemorySuggestionRepository } from '../repositories/in-memory/in-memory-suggestion.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import type { FastifyInstance, InjectOptions } from 'fastify';

const email = 'admin@temveg.ai';
const password = 'correct-horse-battery';
const unknownId = '00000000-0000-0000-0000-000000000000';

const kairu: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Kairú',
  description: null,
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: '48991242935',
  website: null,
  instagram: 'kairu.veg',
  openingHours: {
    monday: [{ opens: '19:00', closes: '23:00' }],
    tuesday: [],
    wednesday: [{ opens: '19:00', closes: '23:00' }],
    thursday: [{ opens: '19:00', closes: '23:00' }],
    friday: [{ opens: '19:00', closes: '23:00' }],
    saturday: [{ opens: '19:00', closes: '23:00' }],
    sunday: [{ opens: '19:00', closes: '23:00' }],
  },
  createdAt: new Date('2026-10-14T12:00:00Z'),
  updatedAt: new Date('2026-10-14T12:00:00Z'),
};

const body = {
  name: 'Novo Veg',
  description: 'Comida caseira',
  type: 'vegan_options',
  address: 'Rua Nova, 2',
  neighborhood: 'Trindade',
  latitude: -27.5865,
  longitude: -48.5226,
  phone: '4833334444',
  website: 'https://novoveg.com',
  instagram: 'novoveg',
  openingHours: {
    monday: [{ opens: '11:00', closes: '15:00' }],
    tuesday: [{ opens: '11:00', closes: '15:00' }],
    wednesday: [{ opens: '11:00', closes: '15:00' }],
    thursday: [{ opens: '11:00', closes: '15:00' }],
    friday: [{ opens: '11:00', closes: '15:00' }],
    saturday: [],
    sunday: [],
  },
};

function withMonday(monday: { opens: string; closes: string }[]) {
  return { ...body, openingHours: { ...body.openingHours, monday } };
}

let app: FastifyInstance;
let token: string;

async function setup() {
  const userRepository = new InMemoryUserRepository();
  await userRepository.create({ email, passwordHash: `hashed:${password}` });
  app = buildApp({
    checkDatabase: async () => true,
    restaurantRepository: new InMemoryRestaurantRepository([kairu]),
    suggestionRepository: new InMemorySuggestionRepository(),
    userRepository,
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
    corsOrigin: 'http://localhost:5173',
  });
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

function asAdmin(options: InjectOptions) {
  return app.inject({ ...options, cookies: { token } });
}

async function getRestaurant(id: string) {
  return app.inject({ method: 'GET', url: `/restaurants/${id}` });
}

afterEach(async () => {
  await app.close();
});

describe('write routes without a session', () => {
  it.each([
    { method: 'POST', url: '/restaurants' },
    { method: 'PUT', url: `/restaurants/${kairu.id}` },
    { method: 'DELETE', url: `/restaurants/${kairu.id}` },
  ] as const)('$method $url responds 401', async ({ method, url }) => {
    await setup();

    const response = await app.inject({ method, url, payload: body });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Não autenticado.' },
    });
    expect((await getRestaurant(kairu.id)).json()).toMatchObject({
      restaurant: { name: kairu.name },
    });
  });
});

describe('read routes', () => {
  it('stay public', async () => {
    await setup();

    const list = await app.inject({ method: 'GET', url: '/restaurants' });
    const detail = await getRestaurant(kairu.id);

    expect(list.statusCode).toBe(200);
    expect(detail.statusCode).toBe(200);
  });
});

describe('GET /restaurants with limit', () => {
  it('returns only the first restaurants in name order', async () => {
    await setup();
    await asAdmin({ method: 'POST', url: '/restaurants', payload: body });

    const response = await app.inject({
      method: 'GET',
      url: '/restaurants?limit=1',
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().restaurants.map(({ name }: Restaurant) => name),
    ).toEqual(['Kairú']);
  });

  it.each(['0', '101', '1.5', 'abc', ''])(
    'responds 400 for limit=%s',
    async (limit) => {
      await setup();

      const response = await app.inject({
        method: 'GET',
        url: `/restaurants?limit=${limit}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [expect.objectContaining({ field: 'limit' })],
        },
      });
    },
  );
});

describe('POST /restaurants', () => {
  it('responds 201 with the created restaurant', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: body,
    });

    expect(response.statusCode).toBe(201);
    const { restaurant } = response.json<{ restaurant: { id: string } }>();
    expect(restaurant).toEqual({
      ...body,
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect((await getRestaurant(restaurant.id)).json()).toEqual({
      restaurant,
    });
  });

  it('responds with the neighborhood capitalized', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, neighborhood: 'lagoa DA conceição' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      restaurant: { neighborhood: 'Lagoa da Conceição' },
    });
  });

  it('stores missing and empty optional fields as null', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: {
        name: '  Novo Veg  ',
        type: 'fully_vegan',
        address: 'Rua Nova, 2',
        neighborhood: 'Trindade',
        latitude: -27.5865,
        longitude: -48.5226,
        phone: '   ',
        website: '',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      restaurant: {
        name: 'Novo Veg',
        description: null,
        phone: null,
        website: null,
        instagram: null,
        openingHours: null,
      },
    });
  });

  it('accepts several intervals a day and one past midnight', async () => {
    await setup();
    const openingHours = {
      ...body.openingHours,
      friday: [
        { opens: '11:00', closes: '15:00' },
        { opens: '18:00', closes: '02:00' },
      ],
      saturday: [{ opens: '17:00', closes: '00:00' }],
    };

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, openingHours },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ restaurant: { openingHours } });
  });

  it('stores the Instagram username without the @', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, instagram: '@novo.veg_' },
    });

    expect(response.json()).toMatchObject({
      restaurant: { instagram: 'novo.veg_' },
    });
  });

  it.each([
    { field: 'name', payload: { ...body, name: '   ' } },
    { field: 'type', payload: { ...body, type: 'vegetarian' } },
    { field: 'address', payload: { ...body, address: undefined } },
    { field: 'latitude', payload: { ...body, latitude: -91 } },
    { field: 'longitude', payload: { ...body, longitude: '-48.5' } },
    { field: 'website', payload: { ...body, website: 'novoveg.com' } },
    { field: 'website', payload: { ...body, website: 'ftp://novoveg.com' } },
    {
      field: 'instagram',
      payload: { ...body, instagram: 'https://instagram.com/novoveg' },
    },
    {
      field: 'openingHours.monday.0.opens',
      payload: withMonday([{ opens: '25:00', closes: '15:00' }]),
    },
    {
      field: 'openingHours.monday.0.closes',
      payload: withMonday([{ opens: '11:00', closes: '15h' }]),
    },
    {
      field: 'openingHours.monday.0',
      payload: withMonday([{ opens: '11:00', closes: '11:00' }]),
    },
    {
      field: 'openingHours.monday.1',
      payload: withMonday([
        { opens: '11:00', closes: '15:00' },
        { opens: '14:00', closes: '18:00' },
      ]),
    },
    {
      field: 'openingHours.monday.0',
      payload: withMonday([
        { opens: '18:00', closes: '02:00' },
        { opens: '19:00', closes: '23:00' },
      ]),
    },
    {
      field: 'openingHours.sunday',
      payload: {
        ...body,
        openingHours: { ...body.openingHours, sunday: undefined },
      },
    },
    {
      field: 'openingHours.holiday',
      payload: {
        ...body,
        openingHours: { ...body.openingHours, holiday: [] },
      },
    },
    { field: 'openingHours', payload: { ...body, openingHours: 'Seg a sex' } },
  ])('responds 400 for an invalid $field', async ({ field, payload }) => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [expect.objectContaining({ field })],
      },
    });
  });

  it('responds 400 with one detail for each unknown field', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, openinghours: 'Seg a sex', city: 'Florianópolis' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: [
          { field: 'openinghours', message: 'Campo desconhecido.' },
          { field: 'city', message: 'Campo desconhecido.' },
        ],
      },
    });
  });

  it('accepts a description of 300 characters and refuses one of 301', async () => {
    await setup();

    const accepted = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, description: 'a'.repeat(300) },
    });
    const refused = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, description: 'a'.repeat(301) },
    });

    expect(accepted.statusCode).toBe(201);
    expect(refused.statusCode).toBe(400);
    expect(refused.json().error.details).toEqual([
      {
        field: 'description',
        message: 'Descrição deve ter no máximo 300 caracteres',
      },
    ]);
  });

  it('stores only the digits of the phone', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, phone: '(48) 99999-8888' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      restaurant: { phone: '48999998888' },
    });
  });

  it.each(['123', '(48) 3333-444', '(48) 99999-88888', '48 9999a-8888'])(
    'refuses the phone %s',
    async (phone) => {
      await setup();

      const response = await asAdmin({
        method: 'POST',
        url: '/restaurants',
        payload: { ...body, phone },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.details).toEqual([
        {
          field: 'phone',
          message: 'Telefone deve ter 10 ou 11 dígitos, com DDD',
        },
      ]);
    },
  );

  it('responds with the validation messages in Portuguese', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: {
        ...withMonday([{ opens: '11:00', closes: '11:00' }]),
        name: '',
        instagram: 'instagram.com/novoveg',
      },
    });

    expect(response.json().error.details).toEqual([
      { field: 'name', message: 'Campo obrigatório' },
      { field: 'instagram', message: 'Usuário do Instagram inválido' },
      {
        field: 'openingHours.monday.0',
        message: 'Abertura e fechamento devem ser diferentes',
      },
    ]);
  });
});

describe('PUT /restaurants/:id', () => {
  it('responds 200 with the restaurant fully replaced', async () => {
    await setup();
    const withoutPhone = { ...body, phone: undefined };

    const response = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: withoutPhone,
    });

    expect(response.statusCode).toBe(200);
    const expected = {
      restaurant: {
        ...body,
        phone: null,
        id: kairu.id,
        createdAt: kairu.createdAt.toISOString(),
        updatedAt: expect.any(String),
      },
    };
    expect(response.json()).toEqual(expected);
    expect((await getRestaurant(kairu.id)).json()).toEqual(expected);
  });

  it('responds with the neighborhood capitalized', async () => {
    await setup();

    const response = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: { ...body, neighborhood: 'sAnTo AnTôNiO dE lIsBoA' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      restaurant: { neighborhood: 'Santo Antônio de Lisboa' },
    });
  });

  it('responds 400 for an invalid body', async () => {
    await setup();

    const response = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: { ...body, name: '' },
    });

    expect(response.statusCode).toBe(400);
    expect((await getRestaurant(kairu.id)).json()).toMatchObject({
      restaurant: { name: kairu.name },
    });
  });

  it('refuses a description of 301 characters', async () => {
    await setup();

    const response = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: { ...body, description: 'a'.repeat(301) },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [expect.objectContaining({ field: 'description' })],
      },
    });
  });

  it('stores only the digits of the phone and refuses 123', async () => {
    await setup();

    const accepted = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: { ...body, phone: '(48) 3333-4444' },
    });
    const refused = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${kairu.id}`,
      payload: { ...body, phone: '123' },
    });

    expect(accepted.json()).toMatchObject({
      restaurant: { phone: '4833334444' },
    });
    expect(refused.statusCode).toBe(400);
    expect((await getRestaurant(kairu.id)).json()).toMatchObject({
      restaurant: { phone: '4833334444' },
    });
  });

  it('responds 400 for an invalid id', async () => {
    await setup();

    const response = await asAdmin({
      method: 'PUT',
      url: '/restaurants/not-a-uuid',
      payload: body,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('responds 404 for an unknown id', async () => {
    await setup();

    const response = await asAdmin({
      method: 'PUT',
      url: `/restaurants/${unknownId}`,
      payload: body,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'RESTAURANT_NOT_FOUND',
        message: 'Restaurante não encontrado.',
      },
    });
  });
});

describe('DELETE /restaurants/:id', () => {
  it('responds 204 and removes the restaurant', async () => {
    await setup();

    const response = await asAdmin({
      method: 'DELETE',
      url: `/restaurants/${kairu.id}`,
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await getRestaurant(kairu.id)).statusCode).toBe(404);
  });

  it('responds 400 for an invalid id', async () => {
    await setup();

    const response = await asAdmin({
      method: 'DELETE',
      url: '/restaurants/not-a-uuid',
    });

    expect(response.statusCode).toBe(400);
  });

  it('responds 404 for an unknown id', async () => {
    await setup();

    const response = await asAdmin({
      method: 'DELETE',
      url: `/restaurants/${unknownId}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'RESTAURANT_NOT_FOUND' },
    });
  });
});
