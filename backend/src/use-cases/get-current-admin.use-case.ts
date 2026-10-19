import type { User } from '../entities/user.js';
import type { UserRepository } from '../repositories/user.repository.js';
import { UnauthenticatedError } from './errors/unauthenticated.error.js';

export class GetCurrentAdminUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    // A valid token whose admin no longer exists is not a session.
    if (!user) {
      throw new UnauthenticatedError();
    }

    return user;
  }
}
