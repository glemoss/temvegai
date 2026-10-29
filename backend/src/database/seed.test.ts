import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const run = promisify(execFile);
const seedScript = fileURLToPath(new URL('./seed.ts', import.meta.url));

describe('seed', () => {
  // Nothing listens on port 1: if the seed tried to connect, it would fail
  // with a connection error instead of the production one.
  it('exits with an error before connecting when NODE_ENV is production', async () => {
    const result = run(process.execPath, ['--import', 'tsx', seedScript], {
      env: {
        PATH: process.env.PATH,
        DATABASE_URL: 'postgres://temveg:temveg@127.0.0.1:1/temveg',
        NODE_ENV: 'production',
      },
    });

    await expect(result).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
        'O seed apaga os dados e não roda com NODE_ENV=production.',
      ),
    });
    await expect(result).rejects.not.toMatchObject({
      stderr: expect.stringMatching(/ECONNREFUSED|Seeds run/),
    });
  });
});
