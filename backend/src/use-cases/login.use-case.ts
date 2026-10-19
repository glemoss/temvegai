import type { User } from '../entities/user.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { PasswordHasher } from '../services/password-hasher.js';
import type { TokenIssuer } from '../services/token-issuer.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
  token: string;
}

export class LoginUseCase {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const credentials = await this.userRepository.findCredentialsByEmail(
      email.trim().toLowerCase(),
    );

    if (!credentials) {
      // Verifying anyway keeps the response time close to that of a wrong
      // password, so the timing does not reveal which emails exist.
      await this.passwordHasher.verify(await this.getDummyHash(), password);
      throw new InvalidCredentialsError();
    }

    if (
      !(await this.passwordHasher.verify(credentials.passwordHash, password))
    ) {
      throw new InvalidCredentialsError();
    }

    const token = await this.tokenIssuer.issue(credentials.user.id);
    return { user: credentials.user, token };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash('dummy-password-for-timing');
    return this.dummyHash;
  }
}
