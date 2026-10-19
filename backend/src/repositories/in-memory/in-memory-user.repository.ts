import { randomUUID } from 'node:crypto';
import type { User } from '../../entities/user.js';
import { EmailAlreadyInUseError } from '../../use-cases/errors/email-already-in-use.error.js';
import type {
  CreateUserData,
  UserCredentials,
  UserRepository,
} from '../user.repository.js';

interface StoredUser extends User {
  passwordHash: string;
}

function toUser({ id, email, createdAt, updatedAt }: StoredUser): User {
  return { id, email, createdAt, updatedAt };
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: StoredUser[] = [];

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((stored) => stored.id === id);
    return user ? toUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((stored) => stored.email === email);
    return user ? toUser(user) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = this.users.find((stored) => stored.email === email);
    return user
      ? { user: toUser(user), passwordHash: user.passwordHash }
      : null;
  }

  async create({ email, passwordHash }: CreateUserData): Promise<User> {
    // Mirrors the unique constraint on users.email.
    if (this.users.some((stored) => stored.email === email)) {
      throw new EmailAlreadyInUseError();
    }

    const now = new Date();
    const user: StoredUser = {
      id: randomUUID(),
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return toUser(user);
  }

  // Test-only helper: lets tests check what was stored as the hash.
  passwordHashOf(email: string): string | undefined {
    return this.users.find((stored) => stored.email === email)?.passwordHash;
  }
}
