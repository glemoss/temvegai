import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { databaseEnvSchema, loadEnvOrExit } from '../config/env.js';
import { createDatabase } from '../database/connection.js';
import { KnexUserRepository } from '../repositories/knex/knex-user.repository.js';
import { Argon2PasswordHasher } from '../services/argon2-password-hasher.js';
import {
  CreateAdminUseCase,
  MIN_PASSWORD_LENGTH,
} from '../use-cases/create-admin.use-case.js';
import { EmailAlreadyInUseError } from '../use-cases/errors/email-already-in-use.error.js';
import { PasswordTooShortError } from '../use-cases/errors/password-too-short.error.js';

class InputError extends Error {}

const emailSchema = z.email();

// Readline echoes what is typed through this stream; muting it hides the password.
let muted = false;
const output = new Writable({
  write(chunk: Buffer, _encoding, callback) {
    if (!muted) {
      process.stdout.write(chunk);
    }
    callback();
  },
});
const readline = createInterface({
  input: process.stdin,
  output,
  terminal: process.stdin.isTTY,
});
const lines = readline[Symbol.asyncIterator]();

async function ask(prompt: string, { hidden = false } = {}): Promise<string> {
  process.stdout.write(prompt);
  muted = hidden;
  const line = await lines.next();
  muted = false;
  if (hidden) {
    process.stdout.write('\n');
  }
  if (line.done) {
    throw new InputError('Entrada encerrada antes do fim.');
  }
  return line.value;
}

async function readInput(): Promise<{ email: string; password: string }> {
  const email = await ask('E-mail: ');
  if (!emailSchema.safeParse(email.trim()).success) {
    throw new InputError('E-mail inválido.');
  }

  const password = await ask(
    `Senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres): `,
    { hidden: true },
  );
  const confirmation = await ask('Confirme a senha: ', { hidden: true });
  if (password !== confirmation) {
    throw new InputError('As senhas não conferem.');
  }

  return { email, password };
}

function errorMessage(error: unknown): string | null {
  if (error instanceof InputError) {
    return error.message;
  }
  if (error instanceof PasswordTooShortError) {
    return `A senha precisa ter pelo menos ${error.minLength} caracteres.`;
  }
  if (error instanceof EmailAlreadyInUseError) {
    return 'Já existe um admin com esse e-mail.';
  }
  return null;
}

const env = loadEnvOrExit(databaseEnvSchema);
const db = createDatabase(env.DATABASE_URL);
const createAdmin = new CreateAdminUseCase(
  new KnexUserRepository(db),
  new Argon2PasswordHasher(),
);

try {
  const admin = await createAdmin.execute(await readInput());
  console.log(`Admin criado: ${admin.email}`);
} catch (error) {
  const message = errorMessage(error);
  if (message === null) {
    throw error;
  }
  console.error(message);
  process.exitCode = 1;
} finally {
  readline.close();
  await db.destroy();
}
