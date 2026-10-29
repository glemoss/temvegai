import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseEnvSchema, loadEnvOrExit } from '../config/env.js';
import { createDatabase } from './connection.js';

const env = loadEnvOrExit(databaseEnvSchema);
const db = createDatabase(env.DATABASE_URL);

try {
  const [files]: [string[]] = await db.seed.run({
    directory: fileURLToPath(new URL('./seeds', import.meta.url)),
    loadExtensions: ['.ts'],
  });
  console.log(
    `Seeds run:\n${files.map((file) => `- ${basename(file)}`).join('\n')}`,
  );
} finally {
  await db.destroy();
}
