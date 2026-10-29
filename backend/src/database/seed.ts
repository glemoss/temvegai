import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvOrExit, seedEnvSchema } from '../config/env.js';
import { createDatabase } from './connection.js';

const env = loadEnvOrExit(seedEnvSchema);

// The seed deletes the restaurants, so it stops before connecting.
if (env.NODE_ENV === 'production') {
  console.error('O seed apaga os dados e não roda com NODE_ENV=production.');
  process.exit(1);
}

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
