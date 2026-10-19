import type { User } from '../entities/user.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
}

export interface UserCredentials {
  user: User;
  passwordHash: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  create(data: CreateUserData): Promise<User>;
}
