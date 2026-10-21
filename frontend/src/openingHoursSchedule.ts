// Reads the weekly opening hours so the details panel can list them and
// tell whether the restaurant is open right now.
import type { TimeInterval, Weekday, WeeklyHours } from './api/restaurants';

export interface OpeningHoursLine {
  days: string;
  hours: string;
}

// Monday first, as the hours are listed.
export const WEEK: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_NAMES: Record<Weekday, string> = {
  monday: 'segunda',
  tuesday: 'terça',
  wednesday: 'quarta',
  thursday: 'quinta',
  friday: 'sexta',
  saturday: 'sábado',
  sunday: 'domingo',
};

const MINUTES_IN_A_DAY = 24 * 60;

// Restaurants are in Florianópolis, so their hours are read on its clock,
// whatever the time zone of the visitor.
const TIME_ZONE = 'America/Sao_Paulo';

// One line per run of consecutive days with the same hours, such as
// "Segunda a sexta" / "11h–15h, 18h–23h" or "Sábado e domingo" / "fechado".
export function openingHoursLines(hours: WeeklyHours): OpeningHoursLine[] {
  const lines: OpeningHoursLine[] = [];
  let start = 0;

  while (start < WEEK.length) {
    const text = formatDay(hours[WEEK[start]]);
    let end = start;
    while (end + 1 < WEEK.length && formatDay(hours[WEEK[end + 1]]) === text) {
      end += 1;
    }
    lines.push({ days: formatDays(start, end), hours: text });
    start = end + 1;
  }
  return lines;
}

export function isOpenAt(hours: WeeklyHours, date: Date): boolean {
  const { day, minutes } = timeInFlorianopolis(date);
  const today = hours[WEEK[day]].map(toMinutes);
  const yesterday = hours[WEEK[(day + 6) % 7]].map(toMinutes);

  return (
    today.some(({ opens, closes }) => opens <= minutes && minutes < closes) ||
    // Still open from the day before, as at 1h for 18h–2h.
    yesterday.some(
      ({ closes }) =>
        closes > MINUTES_IN_A_DAY && minutes < closes - MINUTES_IN_A_DAY,
    )
  );
}

// "Segunda", "Sábado e domingo" or "Segunda a sexta".
function formatDays(start: number, end: number): string {
  const first = DAY_NAMES[WEEK[start]];
  const last = DAY_NAMES[WEEK[end]];
  const days =
    start === end
      ? first
      : end === start + 1
        ? `${first} e ${last}`
        : `${first} a ${last}`;
  return days.charAt(0).toUpperCase() + days.slice(1);
}

function formatDay(intervals: TimeInterval[]): string {
  if (intervals.length === 0) {
    return 'fechado';
  }
  return intervals
    .map(({ opens, closes }) => `${formatTime(opens)}–${formatTime(closes)}`)
    .join(', ');
}

// "11:30" as "11h30" and "00:00" as "0h".
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}h${minutes === '00' ? '' : minutes}`;
}

// Opening and closing in minutes from the start of the day. A closing at
// or before the opening, as in 18:00–02:00, is past 24 hours.
function toMinutes({ opens, closes }: TimeInterval): {
  opens: number;
  closes: number;
} {
  const start = minutesOf(opens);
  const end = minutesOf(closes);
  return { opens: start, closes: end <= start ? end + MINUTES_IN_A_DAY : end };
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
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
