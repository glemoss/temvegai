import type { User } from '../entities/user.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { PasswordHasher } from '../services/password-hasher.js';
import { EmailAlreadyInUseError } from './errors/email-already-in-use.error.js';
import { PasswordTooShortError } from './errors/password-too-short.error.js';

export const MIN_PASSWORD_LENGTH = 12;

export interface CreateAdminInput {
  email: string;
  password: string;
}

export class CreateAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute({ email, password }: CreateAdminInput): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new PasswordTooShortError(MIN_PASSWORD_LENGTH);
    }

    if (await this.userRepository.findByEmail(normalizedEmail)) {
      throw new EmailAlreadyInUseError();
    }

    const passwordHash = await this.passwordHasher.hash(password);
    return this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
    });
  }
}
