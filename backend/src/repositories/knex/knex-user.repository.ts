import type { Knex } from 'knex';
import type { User } from '../../entities/user.js';
import { EmailAlreadyInUseError } from '../../use-cases/errors/email-already-in-use.error.js';
import type {
  CreateUserData,
  UserCredentials,
  UserRepository,
} from '../user.repository.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// The password hash stays in the database layer and never reaches a User.
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}

export class KnexUserRepository implements UserRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db<UserRow>('users').where({ id }).first();
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db<UserRow>('users').where({ email }).first();
    return row ? toUser(row) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const row = await this.db<UserRow>('users').where({ email }).first();
    return row ? { user: toUser(row), passwordHash: row.password_hash } : null;
  }

  async create({ email, passwordHash }: CreateUserData): Promise<User> {
    try {
      const [row] = await this.db<UserRow>('users')
        .insert({ email, password_hash: passwordHash })
        .returning('*');
      return toUser(row as UserRow);
    } catch (error) {
      // Two concurrent creations can both pass the use case's check.
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }
}
