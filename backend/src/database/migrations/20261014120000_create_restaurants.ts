import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('restaurants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.text('description');
    table
      .text('type')
      .notNullable()
      .checkIn(['fully_vegan', 'vegan_options'], 'restaurants_type_check');
    table.text('address').notNullable();
    table.text('neighborhood').notNullable();
    table
      .decimal('latitude', 9, 6)
      .notNullable()
      .checkBetween([-90, 90], 'restaurants_latitude_check');
    table
      .decimal('longitude', 9, 6)
      .notNullable()
      .checkBetween([-180, 180], 'restaurants_longitude_check');
    table.text('phone');
    table.text('website');
    table.text('instagram');
    table.text('opening_hours');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('restaurants');
}
