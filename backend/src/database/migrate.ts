import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';
import { databaseEnvSchema, loadEnvOrExit } from '../config/env.js';
import { createDatabase } from './connection.js';

const command = process.argv[2];

if (command !== 'latest' && command !== 'rollback') {
  console.error('Usage: migrate.ts <latest|rollback>');
  process.exit(1);
}

const env = loadEnvOrExit(databaseEnvSchema);
const db = createDatabase(env.DATABASE_URL);
const config: Knex.MigratorConfig = {
  directory: fileURLToPath(new URL('./migrations', import.meta.url)),
  loadExtensions: ['.ts'],
};

try {
  if (command === 'latest') {
    const [batch, applied]: [number, string[]] =
      await db.migrate.latest(config);
    console.log(
      applied.length === 0
        ? 'Already up to date.'
        : `Batch ${batch} applied:\n${applied.map((name) => `- ${name}`).join('\n')}`,
    );
  } else {
    const [batch, reverted]: [number, string[]] =
      await db.migrate.rollback(config);
    console.log(
      reverted.length === 0
        ? 'Nothing to roll back.'
        : `Batch ${batch} rolled back:\n${reverted.map((name) => `- ${name}`).join('\n')}`,
    );
  }
} finally {
  await db.destroy();
}
