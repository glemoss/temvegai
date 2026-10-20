import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCurrentAdmin,
  InvalidCredentialsError,
  login,
  logout,
  TooManyAttemptsError,
  type Admin,
} from './auth';

vi.mock('../config', () => ({ config: { apiUrl: 'http://api.test' } }));

const admin: Admin = {
  id: '0b6f1a3e-2c4d-4e5f-8a9b-1c2d3e4f5a6b',
  email: 'admin@example.com',
};

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function errorResponse(status: number) {
  return Response.json({ error: { code: 'X', message: 'x' } }, { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login', () => {
  it('posts the credentials to /auth/login sending cookies', async () => {
    const fetchMock = stubFetch(Response.json({ user: admin }));

    await login('admin@example.com', 'a long password');

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'a long password',
      }),
      credentials: 'include',
    });
  });

  it('returns the logged in admin', async () => {
    stubFetch(Response.json({ user: admin }));

    await expect(login('admin@example.com', 'secret')).resolves.toEqual(admin);
  });

  it('throws InvalidCredentialsError on 401', async () => {
    stubFetch(errorResponse(401));

    await expect(login('admin@example.com', 'wrong')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('throws TooManyAttemptsError on 429', async () => {
    stubFetch(errorResponse(429));

    await expect(login('admin@example.com', 'wrong')).rejects.toBeInstanceOf(
      TooManyAttemptsError,
    );
  });

  it('throws a generic error on other failures', async () => {
    stubFetch(errorResponse(500));

    await expect(login('admin@example.com', 'secret')).rejects.toThrow(
      'POST /auth/login respondeu 500',
    );
  });

  it('lets network errors through', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    await expect(login('admin@example.com', 'secret')).rejects.toThrow(
      'Failed to fetch',
    );
  });
});

describe('fetchCurrentAdmin', () => {
  it('calls GET /auth/me sending cookies', async () => {
    const fetchMock = stubFetch(Response.json({ user: admin }));
    const controller = new AbortController();

    await fetchCurrentAdmin(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/auth/me', {
      credentials: 'include',
      signal: controller.signal,
    });
  });

  it('returns the admin of the session', async () => {
    stubFetch(Response.json({ user: admin }));

    await expect(fetchCurrentAdmin()).resolves.toEqual(admin);
  });

  it('returns null without a session', async () => {
    stubFetch(errorResponse(401));

    await expect(fetchCurrentAdmin()).resolves.toBeNull();
  });

  it('throws on other failures', async () => {
    stubFetch(errorResponse(500));

    await expect(fetchCurrentAdmin()).rejects.toThrow(
      'GET /auth/me respondeu 500',
    );
  });
});

describe('logout', () => {
  it('posts to /auth/logout sending cookies', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));

    await logout();

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('throws when the API fails', async () => {
    stubFetch(errorResponse(500));

    await expect(logout()).rejects.toThrow('POST /auth/logout respondeu 500');
  });
});
