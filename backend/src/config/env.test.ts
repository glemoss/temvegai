import { describe, expect, it } from 'vitest';
import { InvalidEnvError, loadEnv } from './env.js';

const databaseUrl = 'postgres://user:secret@localhost:5432/veganos';
const jwtSecret = 'a'.repeat(32);
const required = { DATABASE_URL: databaseUrl, JWT_SECRET: jwtSecret };

describe('loadEnv', () => {
  it('returns the parsed variables', () => {
    const env = loadEnv({ ...required, PORT: '4000', NODE_ENV: 'production' });

    expect(env).toEqual({
      PORT: 4000,
      DATABASE_URL: databaseUrl,
      JWT_SECRET: jwtSecret,
      NODE_ENV: 'production',
    });
  });

  it('defaults PORT to 3000', () => {
    const env = loadEnv(required);

    expect(env.PORT).toBe(3000);
  });

  it('defaults NODE_ENV to development', () => {
    const env = loadEnv(required);

    expect(env.NODE_ENV).toBe('development');
  });

  it('throws naming the missing variable', () => {
    expect(() => loadEnv({})).toThrow(InvalidEnvError);
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
    expect(() => loadEnv({})).toThrow(/JWT_SECRET/);
  });

  it('rejects a DATABASE_URL that is not a postgres url', () => {
    expect(() =>
      loadEnv({ ...required, DATABASE_URL: 'http://localhost' }),
    ).toThrow(InvalidEnvError);
  });

  it('rejects an invalid PORT', () => {
    expect(() => loadEnv({ ...required, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => loadEnv({ ...required, JWT_SECRET: 'a'.repeat(31) })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadEnv({ ...required, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('does not leak variable values in the error message', () => {
    const invalidUrl = 'mysql://user:secret@localhost/veganos';

    expect(() => loadEnv({ ...required, DATABASE_URL: invalidUrl })).toThrow(
      expect.not.objectContaining({
        message: expect.stringContaining('secret'),
      }),
    );
  });

  it('does not leak the JWT_SECRET in the error message', () => {
    const shortSecret = 'short-jwt-secret';

    expect(() => loadEnv({ ...required, JWT_SECRET: shortSecret })).toThrow(
      expect.not.objectContaining({
        message: expect.stringContaining(shortSecret),
      }),
    );
  });
});
