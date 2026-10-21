// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeeklyHours } from './api/restaurants';
import { OpeningHours } from './OpeningHours';

const weekday = [{ opens: '11:00', closes: '14:00' }];
const HOURS: WeeklyHours = {
  monday: weekday,
  tuesday: weekday,
  wednesday: weekday,
  thursday: weekday,
  friday: weekday,
  saturday: [],
  sunday: [],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// 2026-10-19 is a Monday; the time is in Florianópolis (UTC−3).
function setNow(time: string) {
  vi.setSystemTime(new Date(`2026-10-19T${time}-03:00`));
}

describe('OpeningHours', () => {
  it('shows that the restaurant is open now', () => {
    setNow('12:00');
    render(<OpeningHours hours={HOURS} />);

    expect(screen.getByRole('button', { name: 'Aberto agora' })).toBeTruthy();
  });

  it('shows that the restaurant is closed now', () => {
    setNow('20:00');
    render(<OpeningHours hours={HOURS} />);

    expect(screen.getByRole('button', { name: 'Fechado agora' })).toBeTruthy();
  });

  it('hides the full hours until the arrow is clicked', () => {
    setNow('12:00');
    render(<OpeningHours hours={HOURS} />);
    const toggle = screen.getByRole('button', { name: 'Aberto agora' });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list')).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Segunda a sexta11h–14h',
      'Sábado e domingofechado',
    ]);

    fireEvent.click(toggle);

    expect(screen.queryByRole('list')).toBeNull();
  });
});
