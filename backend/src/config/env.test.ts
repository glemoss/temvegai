import { describe, expect, it } from 'vitest';
import { InvalidEnvError, loadEnv } from './env.js';

const databaseUrl = 'postgres://user:secret@localhost:5432/veganos';

describe('loadEnv', () => {
  it('returns the parsed variables', () => {
    const env = loadEnv({ PORT: '4000', DATABASE_URL: databaseUrl });

    expect(env).toEqual({ PORT: 4000, DATABASE_URL: databaseUrl });
  });

  it('defaults PORT to 3000', () => {
    const env = loadEnv({ DATABASE_URL: databaseUrl });

    expect(env.PORT).toBe(3000);
  });

  it('throws naming the missing variable', () => {
    expect(() => loadEnv({})).toThrow(InvalidEnvError);
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not a postgres url', () => {
    expect(() => loadEnv({ DATABASE_URL: 'http://localhost' })).toThrow(
      InvalidEnvError,
    );
  });

  it('rejects an invalid PORT', () => {
    expect(() => loadEnv({ PORT: 'abc', DATABASE_URL: databaseUrl })).toThrow(
      /PORT/,
    );
  });

  it('does not leak variable values in the error message', () => {
    const invalidUrl = 'mysql://user:secret@localhost/veganos';

    expect(() => loadEnv({ DATABASE_URL: invalidUrl })).toThrow(
      expect.not.objectContaining({
        message: expect.stringContaining('secret'),
      }),
    );
  });
});
