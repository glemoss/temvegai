import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('suggestions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('text').notNullable();
    table.text('status').notNullable().defaultTo('pending');
    table.jsonb('draft');
    table.text('error');
    // The suggestion outlives the restaurant it created, if it is removed.
    table
      .uuid('restaurant_id')
      .references('id')
      .inTable('restaurants')
      .onDelete('SET NULL');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.check(
      'char_length(text) <= 300',
      [],
      'suggestions_text_length_check',
    );
    table.check(
      "status in ('pending', 'processing', 'ready', 'failed', 'approved', 'rejected')",
      [],
      'suggestions_status_check',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('suggestions');
}
