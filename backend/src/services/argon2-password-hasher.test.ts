import { describe, expect, it } from 'vitest';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  it('hashes the password with argon2id', async () => {
    const hash = await new Argon2PasswordHasher().hash('correct-horse-battery');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('correct-horse-battery');
  });

  it('uses a random salt, so the same password gives different hashes', async () => {
    const hasher = new Argon2PasswordHasher();

    expect(await hasher.hash('correct-horse-battery')).not.toBe(
      await hasher.hash('correct-horse-battery'),
    );
  });

  it('verifies the right password against its hash', async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash('correct-horse-battery');

    expect(await hasher.verify(hash, 'correct-horse-battery')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash('correct-horse-battery');

    expect(await hasher.verify(hash, 'wrong-horse-battery')).toBe(false);
  });
});
