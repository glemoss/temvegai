// Opening hours are stored as free text that follows one convention:
// "Days: hours" parts separated by semicolons, such as
// "Segunda a sexta: 11h–14h; Sábado e domingo: fechado". This module reads
// that text so the details panel can list it and tell whether the
// restaurant is open right now.

export interface OpeningHoursLine {
  days: string;
  hours: string;
}

// Days in the order the text uses them, Monday first.
const WEEK = [
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
  'domingo',
];

const MINUTES_IN_A_DAY = 24 * 60;

// Restaurants are in Florianópolis, so their hours are read on its clock,
// whatever the time zone of the visitor.
const TIME_ZONE = 'America/Sao_Paulo';

// Opening and closing, in minutes from the start of the day. A closing
// past midnight, as in "18h–2h", is past 24 hours.
interface Interval {
  opens: number;
  closes: number;
}

// One entry per day of the week, Monday first; null when closed.
type WeekSchedule = (Interval | null)[];

export function openingHoursLines(text: string): OpeningHoursLine[] {
  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.indexOf(':');
      return colon === -1
        ? { days: '', hours: part }
        : {
            days: part.slice(0, colon).trim(),
            hours: part.slice(colon + 1).trim(),
          };
    });
}

// Whether the restaurant is open at the given moment, or null when the
// text does not follow the convention and the answer is unknown.
export function isOpenAt(text: string, date: Date): boolean | null {
  const schedule = parseSchedule(text);
  if (!schedule) {
    return null;
  }

  const { day, minutes } = timeInFlorianopolis(date);
  const today = schedule[day];
  const yesterday = schedule[(day + 6) % 7];

  if (today && today.opens <= minutes && minutes < today.closes) {
    return true;
  }
  // Still open from the day before, as at 1h for "18h–2h".
  return (
    !!yesterday &&
    yesterday.closes > MINUTES_IN_A_DAY &&
    minutes < yesterday.closes - MINUTES_IN_A_DAY
  );
}

function parseSchedule(text: string): WeekSchedule | null {
  const schedule: WeekSchedule = Array<Interval | null>(7).fill(null);

  for (const { days, hours } of openingHoursLines(text)) {
    const dayIndexes = parseDays(days);
    const interval = parseHours(hours);
    if (!dayIndexes || interval === undefined) {
      return null;
    }
    for (const day of dayIndexes) {
      schedule[day] = interval;
    }
  }
  return schedule;
}

// "Segunda a sexta", "Sábado e domingo" or "Terça, quinta e sábado".
function parseDays(text: string): number[] | null {
  const items = text.toLowerCase().split(/\s*,\s*|\s+e\s+/);
  const days: number[] = [];

  for (const item of items) {
    const [first, last, ...rest] = item.split(/\s+a\s+/);
    const start = WEEK.indexOf(first ?? '');
    const end = last === undefined ? start : WEEK.indexOf(last);
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

// "11h30–14h" or "fechado"; undefined when it is neither.
function parseHours(text: string): Interval | null | undefined {
  if (text.toLowerCase() === 'fechado') {
    return null;
  }
  const match = /^(\d{1,2})h(\d{2})?\s*[–-]\s*(\d{1,2})h(\d{2})?$/.exec(text);
  if (!match) {
    return undefined;
  }
  const opens = Number(match[1]) * 60 + Number(match[2] ?? 0);
  let closes = Number(match[3]) * 60 + Number(match[4] ?? 0);
  if (closes <= opens) {
    closes += MINUTES_IN_A_DAY;
  }
  return { opens, closes };
}

const clockFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

const WEEKDAYS_IN_ENGLISH = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// The day of the week (Monday is 0) and the minutes since midnight in
// Florianópolis.
function timeInFlorianopolis(date: Date): { day: number; minutes: number } {
  const parts = clockFormat.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return {
    day: WEEKDAYS_IN_ENGLISH.indexOf(part('weekday')),
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
}
