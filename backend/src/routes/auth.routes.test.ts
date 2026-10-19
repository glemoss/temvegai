import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { InMemoryRestaurantRepository } from '../repositories/in-memory/in-memory-restaurant.repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import type { FastifyInstance } from 'fastify';

const email = 'admin@veganos.com';
const password = 'correct-horse-battery';
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

let app: FastifyInstance;

async function setup() {
  const userRepository = new InMemoryUserRepository();
  const admin = await userRepository.create({
    email,
    passwordHash: `hashed:${password}`,
  });
  app = buildApp({
    checkDatabase: async () => true,
    restaurantRepository: new InMemoryRestaurantRepository(),
    userRepository,
    passwordHasher: {
      hash: async (plain) => `hashed:${plain}`,
      verify: async (hash, plain) => hash === `hashed:${plain}`,
    },
    jwtSecret: 'a'.repeat(32),
    cookieSecure: false,
  });
  await app.ready();
  return { admin };
}

function login(body: object) {
  return app.inject({ method: 'POST', url: '/auth/login', payload: body });
}

async function loginToken(): Promise<string> {
  const response = await login({ email, password });
  const cookie = response.cookies.find(({ name }) => name === 'token');
  if (!cookie) {
    throw new Error('login did not set the session cookie');
  }
  return cookie.value;
}

function me(token?: string) {
  return app.inject({
    method: 'GET',
    url: '/auth/me',
    ...(token !== undefined && { cookies: { token } }),
  });
}

const serializedAdmin = (admin: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: admin.id,
  email,
  createdAt: admin.createdAt.toISOString(),
  updatedAt: admin.updatedAt.toISOString(),
});

afterEach(async () => {
  await app.close();
});

describe('POST /auth/login', () => {
  it('responds 200 with the admin and sets an httpOnly session cookie', async () => {
    const { admin } = await setup();

    const response = await login({ email, password });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: serializedAdmin(admin) });
    expect(response.cookies).toEqual([
      expect.objectContaining({
        name: 'token',
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: SEVEN_DAYS_IN_SECONDS,
      }),
    ]);
  });

  it('issues a token for the admin that expires in 7 days', async () => {
    const { admin } = await setup();

    const payload = app.jwt.decode<{ sub: string; iat: number; exp: number }>(
      await loginToken(),
    );

    expect(payload?.sub).toBe(admin.id);
    expect(payload && payload.exp - payload.iat).toBe(SEVEN_DAYS_IN_SECONDS);
  });

  it('keeps the token and the password hash out of the body', async () => {
    await setup();

    const response = await login({ email, password });

    expect(response.body).not.toContain(response.cookies[0]?.value);
    expect(response.body).not.toContain('hashed:');
  });

  it('responds the same 401 for a wrong password and an unknown email', async () => {
    await setup();

    const wrongPassword = await login({
      email,
      password: 'wrong-horse-battery',
    });
    const unknownEmail = await login({ email: 'nobody@veganos.com', password });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.json()).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha inválidos.',
      },
    });
    expect(unknownEmail.json()).toEqual(wrongPassword.json());
    expect(wrongPassword.cookies).toEqual([]);
    expect(unknownEmail.cookies).toEqual([]);
  });

  it('responds 400 for an invalid body', async () => {
    await setup();

    const response = await login({ email: 'not-an-email' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('responds 429 after 5 attempts', async () => {
    await setup();

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await login({ email, password: 'wrong-horse-battery' });
      expect(response.statusCode).toBe(401);
    }
    const response = await login({ email, password });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Muitas tentativas. Tente novamente mais tarde.',
      },
    });
    expect(response.cookies).toEqual([]);
  });

  it('does not limit other routes', async () => {
    await setup();
    const token = await loginToken();

    for (let attempt = 1; attempt <= 6; attempt++) {
      expect((await me(token)).statusCode).toBe(200);
    }
  });
});

describe('GET /auth/me', () => {
  it('responds 200 with the admin for a valid session cookie', async () => {
    const { admin } = await setup();
    const token = await loginToken();

    const response = await me(token);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: serializedAdmin(admin) });
  });

  it('responds 401 without the session cookie', async () => {
    await setup();

    const response = await me();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Não autenticado.' },
    });
  });

  it('responds 401 for a tampered session cookie', async () => {
    await setup();
    const token = await loginToken();

    const response = await me(`${token.slice(0, -2)}xx`);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    });
  });

  it('responds 401 for an expired session cookie', async () => {
    const { admin } = await setup();
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const expiredToken = app.jwt.sign(
      { sub: admin.id },
      { clockTimestamp: eightDaysAgo },
    );

    const response = await me(expiredToken);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    });
  });

  it('does not accept the token in the Authorization header', async () => {
    await setup();
    const token = await loginToken();

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('responds 204 and clears the session cookie', async () => {
    await setup();
    const token = await loginToken();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { token },
    });

    expect(response.statusCode).toBe(204);
    expect(response.cookies).toEqual([
      expect.objectContaining({
        name: 'token',
        value: '',
        path: '/',
        expires: new Date(0),
      }),
    ]);
  });
});
