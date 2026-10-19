import { describe, expect, it } from 'vitest';
import { toUser, type UserRow } from './knex-user.repository.js';

const createdAt = new Date('2026-10-16T12:00:00Z');
const updatedAt = new Date('2026-10-16T13:00:00Z');

const row: UserRow = {
  id: '0b8f6c2e-5d1a-4e7b-9c3f-2a6d8e4b1f70',
  email: 'admin@veganos.com',
  password_hash: '$argon2id$v=19$m=65536,t=3,p=4$salt$hash',
  created_at: createdAt,
  updated_at: updatedAt,
};

describe('toUser', () => {
  it('maps the row to camelCase fields and drops the password hash', () => {
    expect(toUser(row)).toEqual({
      id: '0b8f6c2e-5d1a-4e7b-9c3f-2a6d8e4b1f70',
      email: 'admin@veganos.com',
      createdAt,
      updatedAt,
    });
  });
});
