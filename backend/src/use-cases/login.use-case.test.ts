import { describe, expect, it, vi } from 'vitest';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import type { PasswordHasher } from '../services/password-hasher.js';
import type { TokenIssuer } from '../services/token-issuer.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';
import { LoginUseCase } from './login.use-case.js';

const email = 'admin@temveg.ai';
const password = 'correct-horse-battery';

async function setup() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher: PasswordHasher = {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    verify: vi.fn(
      async (hash: string, plain: string) => hash === `hashed:${plain}`,
    ),
  };
  const tokenIssuer: TokenIssuer = {
    issue: vi.fn(async (userId: string) => `token-for:${userId}`),
  };
  const admin = await userRepository.create({
    email,
    passwordHash: `hashed:${password}`,
  });
  const useCase = new LoginUseCase(userRepository, passwordHasher, tokenIssuer);
  return { admin, passwordHasher, tokenIssuer, useCase };
}

describe('LoginUseCase', () => {
  it('returns the admin and a token issued for them', async () => {
    const { admin, useCase } = await setup();

    const result = await useCase.execute({ email, password });

    expect(result).toEqual({ user: admin, token: `token-for:${admin.id}` });
  });

  it('does not return the password hash', async () => {
    const { useCase } = await setup();

    const { user } = await useCase.execute({ email, password });

    expect(Object.keys(user).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'updatedAt',
    ]);
  });

  it('finds the admin ignoring case and surrounding spaces in the email', async () => {
    const { admin, useCase } = await setup();

    const { user } = await useCase.execute({
      email: '  Admin@TemVeg.AI ',
      password,
    });

    expect(user).toEqual(admin);
  });

  it('rejects a wrong password', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email, password: 'wrong-horse-battery' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    const { useCase } = await setup();

    const wrongPassword = useCase
      .execute({ email, password: 'wrong-horse-battery' })
      .catch((error: unknown) => error);
    const unknownEmail = useCase
      .execute({ email: 'nobody@temveg.ai', password })
      .catch((error: unknown) => error);

    const [wrongPasswordError, unknownEmailError] = await Promise.all([
      wrongPassword,
      unknownEmail,
    ]);
    expect(unknownEmailError).toBeInstanceOf(InvalidCredentialsError);
    expect(unknownEmailError).toEqual(wrongPasswordError);
  });

  it('still verifies a password when the email is unknown', async () => {
    const { passwordHasher, useCase } = await setup();

    await expect(
      useCase.execute({ email: 'nobody@temveg.ai', password }),
    ).rejects.toThrow();

    expect(passwordHasher.verify).toHaveBeenCalledOnce();
  });

  it('does not issue a token when the login is rejected', async () => {
    const { tokenIssuer, useCase } = await setup();

    await expect(
      useCase.execute({ email, password: 'wrong-horse-battery' }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ email: 'nobody@temveg.ai', password }),
    ).rejects.toThrow();

    expect(tokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('keeps the password out of the error message', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email, password: 'secret-pass' }),
    ).rejects.not.toThrow(/secret-pass/);
  });
});
