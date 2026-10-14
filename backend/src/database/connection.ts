import knex, { type Knex } from 'knex';

export function createDatabase(connectionUrl: string): Knex {
  return knex({
    client: 'pg',
    connection: connectionUrl,
    acquireConnectionTimeout: 5000,
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
