import { describe, expect, it } from 'vitest';
import {
  InvalidEnvError,
  databaseEnvSchema,
  loadEnv,
  serverEnvSchema,
} from './env.js';

const databaseUrl = 'postgres://user:secret@localhost:5432/temveg';
const jwtSecret = 'a'.repeat(32);
const corsOrigin = 'http://localhost:5173';
const required = {
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  CORS_ORIGIN: corsOrigin,
};

describe('loadEnv with the server schema', () => {
  it('returns the parsed variables', () => {
    const env = loadEnv(serverEnvSchema, {
      ...required,
      PORT: '4000',
      NODE_ENV: 'production',
    });

    expect(env).toEqual({
      PORT: 4000,
      DATABASE_URL: databaseUrl,
      JWT_SECRET: jwtSecret,
      NODE_ENV: 'production',
      CORS_ORIGIN: corsOrigin,
    });
  });

  it('defaults PORT to 3000', () => {
    const env = loadEnv(serverEnvSchema, required);

    expect(env.PORT).toBe(3000);
  });

  it('defaults NODE_ENV to development', () => {
    const env = loadEnv(serverEnvSchema, required);

    expect(env.NODE_ENV).toBe('development');
  });

  it('throws naming the missing variable', () => {
    expect(() => loadEnv(serverEnvSchema, {})).toThrow(InvalidEnvError);
    expect(() => loadEnv(serverEnvSchema, {})).toThrow(/DATABASE_URL/);
    expect(() => loadEnv(serverEnvSchema, {})).toThrow(/JWT_SECRET/);
    expect(() => loadEnv(serverEnvSchema, {})).toThrow(/CORS_ORIGIN/);
  });

  it('rejects a DATABASE_URL that is not a postgres url', () => {
    expect(() =>
      loadEnv(serverEnvSchema, {
        ...required,
        DATABASE_URL: 'http://localhost',
      }),
    ).toThrow(InvalidEnvError);
  });

  it('rejects an invalid PORT', () => {
    expect(() =>
      loadEnv(serverEnvSchema, { ...required, PORT: 'abc' }),
    ).toThrow(/PORT/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() =>
      loadEnv(serverEnvSchema, { ...required, JWT_SECRET: 'a'.repeat(31) }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() =>
      loadEnv(serverEnvSchema, { ...required, NODE_ENV: 'staging' }),
    ).toThrow(/NODE_ENV/);
  });

  it('reduces CORS_ORIGIN to its origin', () => {
    const env = loadEnv(serverEnvSchema, {
      ...required,
      CORS_ORIGIN: 'http://localhost:5173/',
    });

    expect(env.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('rejects a CORS_ORIGIN that is not an http url', () => {
    expect(() =>
      loadEnv(serverEnvSchema, { ...required, CORS_ORIGIN: 'localhost:5173' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('does not leak variable values in the error message', () => {
    const invalidUrl = 'mysql://user:secret@localhost/temveg';

    expect(() =>
      loadEnv(serverEnvSchema, { ...required, DATABASE_URL: invalidUrl }),
    ).toThrow(
      expect.not.objectContaining({
        message: expect.stringContaining('secret'),
      }),
    );
  });

  it('does not leak the JWT_SECRET in the error message', () => {
    const shortSecret = 'short-jwt-secret';

    expect(() =>
      loadEnv(serverEnvSchema, { ...required, JWT_SECRET: shortSecret }),
    ).toThrow(
      expect.not.objectContaining({
        message: expect.stringContaining(shortSecret),
      }),
    );
  });
});

describe('loadEnv with the database schema', () => {
  it('needs only DATABASE_URL', () => {
    expect(loadEnv(databaseEnvSchema, { DATABASE_URL: databaseUrl })).toEqual({
      DATABASE_URL: databaseUrl,
    });
  });

  it('throws naming only DATABASE_URL when it is missing', () => {
    expect(() => loadEnv(databaseEnvSchema, {})).toThrow(/DATABASE_URL/);
    expect(() => loadEnv(databaseEnvSchema, {})).not.toThrow(/JWT_SECRET/);
    expect(() => loadEnv(databaseEnvSchema, {})).not.toThrow(/CORS_ORIGIN/);
  });
});
