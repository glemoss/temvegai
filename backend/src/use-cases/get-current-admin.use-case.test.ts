import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository.js';
import { UnauthenticatedError } from './errors/unauthenticated.error.js';
import { GetCurrentAdminUseCase } from './get-current-admin.use-case.js';

describe('GetCurrentAdminUseCase', () => {
  it('returns the admin with the given id', async () => {
    const userRepository = new InMemoryUserRepository();
    const admin = await userRepository.create({
      email: 'admin@temveg.ai',
      passwordHash: 'hash',
    });
    const useCase = new GetCurrentAdminUseCase(userRepository);

    expect(await useCase.execute(admin.id)).toEqual(admin);
  });

  it('throws UnauthenticatedError when the admin does not exist', async () => {
    const useCase = new GetCurrentAdminUseCase(new InMemoryUserRepository());

    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
