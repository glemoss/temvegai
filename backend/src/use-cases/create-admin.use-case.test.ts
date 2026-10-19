import { describe, expect, it, vi } from 'vitest';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import type { PasswordHasher } from '../services/password-hasher.js';
import { CreateAdminUseCase } from './create-admin.use-case.js';
import { EmailAlreadyInUseError } from './errors/email-already-in-use.error.js';
import { PasswordTooShortError } from './errors/password-too-short.error.js';

const password = 'correct-horse-battery';

function setup() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher: PasswordHasher = {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    verify: vi.fn(
      async (hash: string, plain: string) => hash === `hashed:${plain}`,
    ),
  };
  const useCase = new CreateAdminUseCase(userRepository, passwordHasher);
  return { userRepository, passwordHasher, useCase };
}

describe('CreateAdminUseCase', () => {
  it('creates the admin with the password stored as a hash', async () => {
    const { userRepository, useCase } = setup();

    const admin = await useCase.execute({
      email: 'admin@veganos.com',
      password,
    });

    expect(admin.email).toBe('admin@veganos.com');
    expect(userRepository.passwordHashOf('admin@veganos.com')).toBe(
      `hashed:${password}`,
    );
  });

  it('does not return the password or its hash', async () => {
    const { useCase } = setup();

    const admin = await useCase.execute({
      email: 'admin@veganos.com',
      password,
    });

    expect(Object.keys(admin).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'updatedAt',
    ]);
  });

  it('stores the email trimmed and in lowercase', async () => {
    const { userRepository, useCase } = setup();

    const admin = await useCase.execute({
      email: '  Admin@Veganos.COM ',
      password,
    });

    expect(admin.email).toBe('admin@veganos.com');
    expect(await userRepository.findByEmail('admin@veganos.com')).toEqual(
      admin,
    );
  });

  it('rejects an email that is already in use, ignoring case', async () => {
    const { useCase } = setup();
    await useCase.execute({ email: 'admin@veganos.com', password });

    await expect(
      useCase.execute({ email: 'ADMIN@veganos.com', password }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('rejects a password shorter than 12 characters', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ email: 'admin@veganos.com', password: 'a'.repeat(11) }),
    ).rejects.toBeInstanceOf(PasswordTooShortError);
  });

  it('accepts a password with exactly 12 characters', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ email: 'admin@veganos.com', password: 'a'.repeat(12) }),
    ).resolves.toMatchObject({ email: 'admin@veganos.com' });
  });

  it('does not hash the password when the creation is rejected', async () => {
    const { passwordHasher, useCase } = setup();
    await useCase.execute({ email: 'admin@veganos.com', password });
    vi.mocked(passwordHasher.hash).mockClear();

    await expect(
      useCase.execute({ email: 'other@veganos.com', password: 'short' }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ email: 'admin@veganos.com', password }),
    ).rejects.toThrow();

    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it('keeps the password out of the error message', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ email: 'admin@veganos.com', password: 'secret-pass' }),
    ).rejects.not.toThrow(/secret-pass/);
  });
});
