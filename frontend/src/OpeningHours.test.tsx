// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpeningHours } from './OpeningHours';

const HOURS = 'Segunda a sexta: 11h–14h; Sábado e domingo: fechado';

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
    render(<OpeningHours text={HOURS} />);

    expect(screen.getByRole('button', { name: 'Aberto agora' })).toBeTruthy();
  });

  it('shows that the restaurant is closed now', () => {
    setNow('20:00');
    render(<OpeningHours text={HOURS} />);

    expect(screen.getByRole('button', { name: 'Fechado agora' })).toBeTruthy();
  });

  it('hides the full hours until the arrow is clicked', () => {
    setNow('12:00');
    render(<OpeningHours text={HOURS} />);
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

  it('lists text outside the convention right away, without a state', () => {
    setNow('12:00');
    render(<OpeningHours text="Consultar no Instagram" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('listitem').textContent).toBe(
      'Consultar no Instagram',
    );
  });
});
