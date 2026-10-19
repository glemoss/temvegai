import { describe, expect, it } from 'vitest';
import { EmailAlreadyInUseError } from '../../use-cases/errors/email-already-in-use.error.js';
import { InMemoryUserRepository } from './in-memory-user.repository.js';

const data = { email: 'admin@veganos.com', passwordHash: 'hash' };

describe('InMemoryUserRepository', () => {
  it('creates a user without exposing the password hash', async () => {
    const repository = new InMemoryUserRepository();

    const user = await repository.create(data);

    expect(user).toEqual({
      id: expect.any(String),
      email: 'admin@veganos.com',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('finds a user by email', async () => {
    const repository = new InMemoryUserRepository();
    const user = await repository.create(data);

    expect(await repository.findByEmail('admin@veganos.com')).toEqual(user);
  });

  it('returns null for an unknown email', async () => {
    const repository = new InMemoryUserRepository();

    expect(await repository.findByEmail('nobody@veganos.com')).toBeNull();
  });

  it('rejects a repeated email, like the unique constraint', async () => {
    const repository = new InMemoryUserRepository();
    await repository.create(data);

    await expect(repository.create(data)).rejects.toBeInstanceOf(
      EmailAlreadyInUseError,
    );
  });
});
