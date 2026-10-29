import knex, { type Knex } from 'knex';

// Without a logger, Knex writes its messages to the console.
export function createDatabase(connectionUrl: string, log?: Knex.Logger): Knex {
  return knex({
    client: 'pg',
    connection: connectionUrl,
    acquireConnectionTimeout: 5000,
    log,
  });
}

export async function isDatabaseReachable(db: Knex): Promise<boolean> {
  try {
    await db.raw('select 1');
    return true;
  } catch {
    return false;
  }
}
