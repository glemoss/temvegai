import { describe, expect, it } from 'vitest';
import type { TimeInterval, WeeklyHours } from './api/restaurants';
import { isOpenAt, openingHoursLines } from './openingHoursSchedule';

// Florianópolis is at UTC−3, so these moments are given in its local time.
function florianopolis(isoWithoutZone: string): Date {
  return new Date(`${isoWithoutZone}-03:00`);
}

// 2026-10-19 is a Monday.
const MONDAY = '2026-10-19';
const TUESDAY = '2026-10-20';
const SATURDAY = '2026-10-24';
const SUNDAY = '2026-10-25';

const CLOSED: WeeklyHours = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

function interval(opens: string, closes: string): TimeInterval {
  return { opens, closes };
}

const lunch: WeeklyHours = {
  ...CLOSED,
  monday: [interval('11:30', '14:00')],
  tuesday: [interval('11:30', '14:00')],
  wednesday: [interval('11:30', '14:00')],
  thursday: [interval('11:30', '14:00')],
  friday: [interval('11:30', '14:00')],
};

describe('openingHoursLines', () => {
  it('joins consecutive days with the same hours', () => {
    expect(openingHoursLines(lunch)).toEqual([
      { days: 'Segunda a sexta', hours: '11h30–14h' },
      { days: 'Sábado e domingo', hours: 'fechado' },
    ]);
  });

  it('lists several intervals of a day and 0h for midnight', () => {
    expect(
      openingHoursLines({
        ...CLOSED,
        monday: [interval('11:00', '15:00'), interval('18:00', '00:00')],
        wednesday: [interval('11:00', '15:00')],
      }),
    ).toEqual([
      { days: 'Segunda', hours: '11h–15h, 18h–0h' },
      { days: 'Terça', hours: 'fechado' },
      { days: 'Quarta', hours: '11h–15h' },
      { days: 'Quinta a domingo', hours: 'fechado' },
    ]);
  });
});

describe('isOpenAt', () => {
  it('is open during the hours of the day', () => {
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T11:30`))).toBe(true);
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T13:59`))).toBe(true);
  });

  it('is closed outside the hours of the day', () => {
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T11:29`))).toBe(false);
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T14:00`))).toBe(false);
  });

  it('is closed on closed days', () => {
    expect(isOpenAt(lunch, florianopolis(`${SATURDAY}T12:00`))).toBe(false);
  });

  it('is closed between two intervals of the same day', () => {
    const hours = {
      ...CLOSED,
      monday: [interval('11:00', '15:00'), interval('18:00', '23:00')],
    };

    expect(isOpenAt(hours, florianopolis(`${MONDAY}T12:00`))).toBe(true);
    expect(isOpenAt(hours, florianopolis(`${MONDAY}T16:00`))).toBe(false);
    expect(isOpenAt(hours, florianopolis(`${MONDAY}T19:00`))).toBe(true);
  });

  it('stays open past midnight into the next day', () => {
    const bar = { ...CLOSED, saturday: [interval('18:00', '02:00')] };

    expect(isOpenAt(bar, florianopolis(`${SUNDAY}T01:59`))).toBe(true);
    expect(isOpenAt(bar, florianopolis(`${SUNDAY}T02:00`))).toBe(false);
    expect(isOpenAt(bar, florianopolis(`${MONDAY}T01:00`))).toBe(false);
  });

  it('reads 00:00 as midnight', () => {
    const hours = { ...CLOSED, monday: [interval('17:00', '00:00')] };

    expect(isOpenAt(hours, florianopolis(`${MONDAY}T23:59`))).toBe(true);
    expect(isOpenAt(hours, florianopolis(`${TUESDAY}T00:00`))).toBe(false);
  });

  it('uses the clock of Florianópolis whatever the time zone', () => {
    // 15h in UTC is 12h in Florianópolis.
    expect(isOpenAt(lunch, new Date(`${MONDAY}T15:00Z`))).toBe(true);
  });
});
