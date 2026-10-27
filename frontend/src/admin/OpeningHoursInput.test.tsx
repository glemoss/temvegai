// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WeeklyHours } from '../api/restaurants';
import { OpeningHoursInput } from './OpeningHoursInput';
import { emptyWeek } from './restaurantFormSchema';

function renderInput(value: WeeklyHours, errors = {}) {
  const onChange = vi.fn<(value: WeeklyHours) => void>();
  render(
    <OpeningHoursInput value={value} errors={errors} onChange={onChange} />,
  );
  return onChange;
}

afterEach(() => {
  cleanup();
});

describe('OpeningHoursInput', () => {
  it('shows a column per day, closed when it has no interval', () => {
    renderInput({
      ...emptyWeek,
      monday: [
        { opens: '11:00', closes: '15:00' },
        { opens: '18:00', closes: '22:00' },
      ],
    });

    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ]);
    expect(screen.getAllByText('Fechado')).toHaveLength(6);
    expect(
      (screen.getByLabelText('Segunda, intervalo 2: abre') as HTMLInputElement)
        .value,
    ).toBe('18:00');
  });

  it('adds an empty interval to a day', () => {
    const onChange = renderInput(emptyWeek);

    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar intervalo em sábado' }),
    );

    expect(onChange).toHaveBeenCalledWith({
      ...emptyWeek,
      saturday: [{ opens: '', closes: '' }],
    });
  });

  it('changes and removes an interval', () => {
    const value = {
      ...emptyWeek,
      monday: [
        { opens: '11:00', closes: '15:00' },
        { opens: '18:00', closes: '22:00' },
      ],
    };
    const onChange = renderInput(value);

    fireEvent.change(screen.getByLabelText('Segunda, intervalo 2: fecha'), {
      target: { value: '23:30' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...emptyWeek,
      monday: [
        { opens: '11:00', closes: '15:00' },
        { opens: '18:00', closes: '23:30' },
      ],
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remover intervalo 1 de segunda' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...emptyWeek,
      monday: [{ opens: '18:00', closes: '22:00' }],
    });
  });

  it('shows the first error of the week, named by its day, and marks the times', () => {
    renderInput(
      {
        ...emptyWeek,
        monday: [{ opens: '', closes: '15:00' }],
        friday: [
          { opens: '11:00', closes: '15:00' },
          { opens: '14:00', closes: '18:00' },
        ],
      },
      {
        'openingHours.friday.1': 'Intervalos fora de ordem ou sobrepostos.',
        'openingHours.monday.0.opens': 'Informe a abertura.',
      },
    );

    expect(screen.getByText('Segunda: Informe a abertura.')).toBeTruthy();
    expect(screen.queryByText(/Intervalos fora de ordem/)).toBeNull();
    expect(
      screen
        .getByLabelText('Segunda, intervalo 1: abre')
        .getAttribute('aria-invalid'),
    ).toBe('true');
    expect(
      screen
        .getByLabelText('Segunda, intervalo 1: fecha')
        .getAttribute('aria-invalid'),
    ).toBe('false');
    expect(
      screen
        .getByLabelText('Sexta, intervalo 2: abre')
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('copies the hours of a day to the other days', () => {
    const tuesday = [
      { opens: '11:00', closes: '15:00' },
      { opens: '18:00', closes: '23:00' },
    ];
    const onChange = renderInput({
      ...emptyWeek,
      monday: [{ opens: '08:00', closes: '12:00' }],
      tuesday,
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Copiar horário de terça para os outros dias',
      }),
    );

    expect(onChange).toHaveBeenCalledWith({
      monday: tuesday,
      tuesday,
      wednesday: tuesday,
      thursday: tuesday,
      friday: tuesday,
      saturday: tuesday,
      sunday: tuesday,
    });
  });

  it('closes every day when a closed day is copied', () => {
    const onChange = renderInput({
      ...emptyWeek,
      monday: [{ opens: '08:00', closes: '12:00' }],
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Copiar horário de domingo para os outros dias',
      }),
    );

    expect(onChange).toHaveBeenCalledWith(emptyWeek);
  });
});
