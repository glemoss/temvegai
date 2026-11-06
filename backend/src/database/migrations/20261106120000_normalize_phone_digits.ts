import type { Knex } from 'knex';

// Stores phones as digits only, such as "48999998888" for
// "(48) 99999-8888". A phone that does not end up with 10 or 11 digits
// (area code and number) is kept as it is and listed in the output, so an
// admin can fix it.
//
// The conversion lives here, apart from the application code, so the
// migration keeps working however that code changes later.

interface Row {
  id: string;
  name: string;
  phone: string;
}

export async function up(knex: Knex): Promise<void> {
  const rows = await knex<Row>('restaurants')
    .select('id', 'name', 'phone')
    .whereNotNull('phone');

  for (const row of rows) {
    const digits = row.phone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(digits)) {
      console.warn(
        `Phone of "${row.name}" (${row.id}) kept as it is, without 10 or 11 digits: "${row.phone}". Fix it in the admin panel.`,
      );
      continue;
    }
    await knex('restaurants').where({ id: row.id }).update({ phone: digits });
  }
}

// Back to "(48) 3333-4444" or "(48) 99999-8888". Phones kept as they were
// by up stay the same.
export async function down(knex: Knex): Promise<void> {
  const rows = await knex<Row>('restaurants')
    .select('id', 'name', 'phone')
    .whereNotNull('phone');

  for (const row of rows) {
    const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(row.phone);
    if (!match) {
      continue;
    }
    const [, areaCode, prefix, line] = match;
    await knex('restaurants')
      .where({ id: row.id })
      .update({ phone: `(${areaCode}) ${prefix}-${line}` });
  }
}
