import { describe, expect, it } from 'vitest';
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

describe('openingHoursLines', () => {
  it('splits the text into days and hours', () => {
    expect(
      openingHoursLines('Segunda a sexta: 11h–14h; Sábado e domingo: fechado'),
    ).toEqual([
      { days: 'Segunda a sexta', hours: '11h–14h' },
      { days: 'Sábado e domingo', hours: 'fechado' },
    ]);
  });

  it('keeps a part without days as written', () => {
    expect(openingHoursLines('Consultar no Instagram')).toEqual([
      { days: '', hours: 'Consultar no Instagram' },
    ]);
  });
});

describe('isOpenAt', () => {
  const lunch = 'Segunda a sexta: 11h30–14h; Sábado e domingo: fechado';

  it('is open during the hours of the day', () => {
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T11:30`))).toBe(true);
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T13:59`))).toBe(true);
  });

  it('is closed outside the hours of the day', () => {
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T11:29`))).toBe(false);
    expect(isOpenAt(lunch, florianopolis(`${MONDAY}T14:00`))).toBe(false);
  });

  it('is closed on days marked as closed', () => {
    expect(isOpenAt(lunch, florianopolis(`${SATURDAY}T12:00`))).toBe(false);
  });

  it('is closed on days that are not listed', () => {
    expect(
      isOpenAt('Segunda: 11h–14h', florianopolis(`${TUESDAY}T12:00`)),
    ).toBe(false);
  });

  it('stays open past midnight into the next day', () => {
    const bar = 'Segunda a sábado: 18h–2h; Domingo: fechado';

    expect(isOpenAt(bar, florianopolis(`${SUNDAY}T01:59`))).toBe(true);
    expect(isOpenAt(bar, florianopolis(`${SUNDAY}T02:00`))).toBe(false);
    expect(isOpenAt(bar, florianopolis(`${MONDAY}T01:00`))).toBe(false);
  });

  it('reads 0h as midnight', () => {
    const text = 'Segunda: 17h–0h';

    expect(isOpenAt(text, florianopolis(`${MONDAY}T23:59`))).toBe(true);
    expect(isOpenAt(text, florianopolis(`${TUESDAY}T00:00`))).toBe(false);
  });

  it('reads lists of days and ranges that wrap around the week', () => {
    const text = 'Terça, quinta e sexta a segunda: 10h–12h';

    expect(isOpenAt(text, florianopolis(`${TUESDAY}T11:00`))).toBe(true);
    expect(isOpenAt(text, florianopolis(`${SUNDAY}T11:00`))).toBe(true);
    expect(isOpenAt(text, florianopolis(`${MONDAY}T11:00`))).toBe(true);
    expect(isOpenAt(text, florianopolis('2026-10-21T11:00'))).toBe(false);
  });

  it('uses the clock of Florianópolis whatever the time zone', () => {
    // 15h in UTC is 12h in Florianópolis.
    expect(isOpenAt(lunch, new Date(`${MONDAY}T15:00Z`))).toBe(true);
  });

  it('is unknown when the text does not follow the convention', () => {
    const now = florianopolis(`${MONDAY}T12:00`);

    expect(isOpenAt('Consultar no Instagram', now)).toBeNull();
    expect(isOpenAt('Seg a sex: 11h–14h', now)).toBeNull();
    expect(isOpenAt('Segunda: ao meio-dia', now)).toBeNull();
  });
});
