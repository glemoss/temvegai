import type { Knex } from 'knex';

// Turns the free-text opening hours into a jsonb weekly schedule. The text
// follows the convention "Days: hours" parts separated by semicolons, such
// as "Segunda a sexta: 11h–14h; Sábado e domingo: fechado". Text outside
// the convention aborts the migration, so it can be fixed by hand first.
//
// The conversion lives here, apart from the application code, so the
// migration keeps working however that code changes later.

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// The days as the text writes them, Monday first.
const DAY_NAMES = [
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
  'domingo',
];

interface TimeInterval {
  opens: string;
  closes: string;
}

type WeeklyHours = Record<(typeof WEEKDAYS)[number], TimeInterval[]>;

interface Row {
  id: string;
  name: string;
  opening_hours: string | null;
}

export async function up(knex: Knex): Promise<void> {
  const rows = await knex<Row>('restaurants').select(
    'id',
    'name',
    'opening_hours',
  );

  await knex.schema.alterTable('restaurants', (table) => {
    table.jsonb('opening_hours_structured');
  });

  for (const row of rows) {
    if (row.opening_hours === null) {
      continue;
    }
    const hours = parseText(row.opening_hours);
    if (!hours) {
      throw new Error(
        `Opening hours of "${row.name}" (${row.id}) do not follow the convention: "${row.opening_hours}". Fix the text and run the migration again.`,
      );
    }
    await knex('restaurants')
      .where({ id: row.id })
      .update({ opening_hours_structured: JSON.stringify(hours) });
  }

  await knex.schema.alterTable('restaurants', (table) => {
    table.dropColumn('opening_hours');
  });
  await knex.schema.alterTable('restaurants', (table) => {
    table.renameColumn('opening_hours_structured', 'opening_hours');
  });
}

export async function down(knex: Knex): Promise<void> {
  const rows = await knex<{ id: string; opening_hours: WeeklyHours | null }>(
    'restaurants',
  ).select('id', 'opening_hours');

  await knex.schema.alterTable('restaurants', (table) => {
    table.text('opening_hours_text');
  });

  for (const row of rows) {
    if (row.opening_hours === null) {
      continue;
    }
    await knex('restaurants')
      .where({ id: row.id })
      .update({ opening_hours_text: formatText(row.opening_hours) });
  }

  await knex.schema.alterTable('restaurants', (table) => {
    table.dropColumn('opening_hours');
  });
  await knex.schema.alterTable('restaurants', (table) => {
    table.renameColumn('opening_hours_text', 'opening_hours');
  });
}

function parseText(text: string): WeeklyHours | null {
  const days: (TimeInterval[] | undefined)[] =
    Array<undefined>(7).fill(undefined);

  for (const part of text.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const colon = trimmed.indexOf(':');
    if (colon === -1) {
      return null;
    }
    const dayIndexes = parseDays(trimmed.slice(0, colon).trim());
    const intervals = parseHours(trimmed.slice(colon + 1).trim());
    if (!dayIndexes || !intervals) {
      return null;
    }
    for (const day of dayIndexes) {
      days[day] = intervals;
    }
  }

  // Days the text leaves out were closed, as the frontend read them.
  return Object.fromEntries(
    WEEKDAYS.map((weekday, index) => [weekday, days[index] ?? []]),
  ) as WeeklyHours;
}

// "Segunda a sexta", "Sábado e domingo" or "Terça, quinta e sábado".
function parseDays(text: string): number[] | null {
  const days: number[] = [];

  for (const item of text.toLowerCase().split(/\s*,\s*|\s+e\s+/)) {
    const [first, last, ...rest] = item.split(/\s+a\s+/);
    const start = DAY_NAMES.indexOf(first ?? '');
    const end = last === undefined ? start : DAY_NAMES.indexOf(last);
    if (start === -1 || end === -1 || rest.length > 0) {
      return null;
    }
    for (let day = start; ; day = (day + 1) % 7) {
      days.push(day);
      if (day === end) {
        break;
      }
    }
  }
  return days;
}

// "11h30–14h" or "fechado".
function parseHours(text: string): TimeInterval[] | null {
  if (text.toLowerCase() === 'fechado') {
    return [];
  }
  const match = /^(\d{1,2})h(\d{2})?\s*[–-]\s*(\d{1,2})h(\d{2})?$/.exec(text);
  if (!match) {
    return null;
  }
  const opens = toTime(match[1], match[2]);
  const closes = toTime(match[3], match[4]);
  return opens && closes && opens !== closes ? [{ opens, closes }] : null;
}

function toTime(
  hours: string | undefined,
  minutes: string | undefined,
): string | null {
  const h = Number(hours);
  const m = Number(minutes ?? 0);
  if (h > 23 || m > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Back to the convention, joining consecutive days with the same hours.
// Several intervals in a day become "11h–15h e 18h–23h", which the text
// convention never had.
function formatText(hours: WeeklyHours): string {
  const parts: string[] = [];
  let start = 0;

  while (start < 7) {
    const value = formatHours(hours[WEEKDAYS[start]]);
    let end = start;
    while (end + 1 < 7 && formatHours(hours[WEEKDAYS[end + 1]]) === value) {
      end += 1;
    }
    parts.push(`${formatDays(start, end)}: ${value}`);
    start = end + 1;
  }
  return parts.join('; ');
}

function formatDays(start: number, end: number): string {
  const first = capitalize(DAY_NAMES[start] ?? '');
  const last = DAY_NAMES[end] ?? '';
  if (start === end) {
    return first;
  }
  return end === start + 1 ? `${first} e ${last}` : `${first} a ${last}`;
}

function formatHours(intervals: TimeInterval[]): string {
  if (intervals.length === 0) {
    return 'fechado';
  }
  return intervals
    .map(({ opens, closes }) => `${formatTime(opens)}–${formatTime(closes)}`)
    .join(' e ');
}

// "11:30" as "11h30" and "00:00" as "0h".
function formatTime(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  return `${Number(hours)}h${minutes === '00' ? '' : minutes}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
