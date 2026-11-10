import type { Knex } from 'knex';

// When the AI last started on the suggestion; the daily limit of processings
// counts the suggestions started since midnight.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('suggestions', (table) => {
    table.timestamp('processing_started_at', { useTz: true });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('suggestions', (table) => {
    table.dropColumn('processing_started_at');
  });
}
