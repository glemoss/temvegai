import { config } from '../config';

export interface Admin {
  id: string;
  email: string;
}

// Wrong e-mail or password; the API answers both with the same 401.
export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha inválidos.');
    this.name = 'InvalidCredentialsError';
  }
}

export class TooManyAttemptsError extends Error {
  constructor() {
    super('Muitas tentativas. Tente novamente mais tarde.');
    this.name = 'TooManyAttemptsError';
  }
}

// The session is a httpOnly cookie, so every auth request sends and
// receives cookies.
export async function login(email: string, password: string): Promise<Admin> {
  const response = await fetch(`${config.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (response.status === 401) throw new InvalidCredentialsError();
  if (response.status === 429) throw new TooManyAttemptsError();
  if (!response.ok) {
    throw new Error(`POST /auth/login respondeu ${response.status}`);
  }

  const body = (await response.json()) as { user: Admin };
  return body.user;
}

// The admin of the current session, or null when there is none.
export async function fetchCurrentAdmin(
  signal?: AbortSignal,
): Promise<Admin | null> {
  const response = await fetch(`${config.apiUrl}/auth/me`, {
    credentials: 'include',
    signal,
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`GET /auth/me respondeu ${response.status}`);
  }

  const body = (await response.json()) as { user: Admin };
  return body.user;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${config.apiUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`POST /auth/logout respondeu ${response.status}`);
  }
}
