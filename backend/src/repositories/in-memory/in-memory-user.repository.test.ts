import { describe, expect, it } from 'vitest';
import { EmailAlreadyInUseError } from '../../use-cases/errors/email-already-in-use.error.js';
import { InMemoryUserRepository } from './in-memory-user.repository.js';

const data = { email: 'admin@temveg.ai', passwordHash: 'hash' };

describe('InMemoryUserRepository', () => {
  it('creates a user without exposing the password hash', async () => {
    const repository = new InMemoryUserRepository();

    const user = await repository.create(data);

    expect(user).toEqual({
      id: expect.any(String),
      email: 'admin@temveg.ai',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('finds a user by email', async () => {
    const repository = new InMemoryUserRepository();
    const user = await repository.create(data);

    expect(await repository.findByEmail('admin@temveg.ai')).toEqual(user);
  });

  it('returns null for an unknown email', async () => {
    const repository = new InMemoryUserRepository();

    expect(await repository.findByEmail('nobody@temveg.ai')).toBeNull();
  });

  it('finds a user by id', async () => {
    const repository = new InMemoryUserRepository();
    const user = await repository.create(data);

    expect(await repository.findById(user.id)).toEqual(user);
  });

  it('returns null for an unknown id', async () => {
    const repository = new InMemoryUserRepository();

    expect(
      await repository.findById('00000000-0000-0000-0000-000000000000'),
    ).toBeNull();
  });

  it('finds the credentials by email, with the password hash apart from the user', async () => {
    const repository = new InMemoryUserRepository();
    const user = await repository.create(data);

    expect(await repository.findCredentialsByEmail('admin@temveg.ai')).toEqual({
      user,
      passwordHash: 'hash',
    });
  });

  it('returns null credentials for an unknown email', async () => {
    const repository = new InMemoryUserRepository();

    expect(
      await repository.findCredentialsByEmail('nobody@temveg.ai'),
    ).toBeNull();
  });

  it('rejects a repeated email, like the unique constraint', async () => {
    const repository = new InMemoryUserRepository();
    await repository.create(data);

    await expect(repository.create(data)).rejects.toBeInstanceOf(
      EmailAlreadyInUseError,
    );
  });
});
