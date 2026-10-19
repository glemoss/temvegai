import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { Restaurant } from '../entities/restaurant.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import type { FastifyInstance, InjectOptions } from 'fastify';

const email = 'admin@veganos.com';
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
  phone: '(48) 99124-2935',
  website: null,
  instagram: 'kairu.veg',
  openingHours: 'Seg e qua a dom, 19h–23h; fecha ter',
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
  phone: '(48) 3333-4444',
  website: 'https://novoveg.com',
  instagram: 'novoveg',
  openingHours: 'Seg a sex, 11h–15h',
};

let app: FastifyInstance;
let token: string;

async function setup() {
  const userRepository = new InMemoryUserRepository();
  await userRepository.create({ email, passwordHash: `hashed:${password}` });
  app = buildApp({
    checkDatabase: async () => true,
    restaurantRepository: new InMemoryRestaurantRepository([kairu]),
    userRepository,
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
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

  it('responds 400 for an unknown field', async () => {
    await setup();

    const response = await asAdmin({
      method: 'POST',
      url: '/restaurants',
      payload: { ...body, openinghours: 'Seg a sex' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [
          expect.objectContaining({
            message: expect.stringContaining('openinghours'),
          }),
        ],
      },
    });
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
