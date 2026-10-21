import type { TimeInterval, Weekday, WeeklyHours } from '../api/restaurants';
import { DAY_NAMES, WEEK } from '../openingHoursSchedule';
import { PlusIcon, TrashIcon } from './icons';
import type { FormErrors } from './restaurantFormSchema';

interface OpeningHoursInputProps {
  value: WeeklyHours;
  errors: FormErrors;
  onChange: (value: WeeklyHours) => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The first message about the week, named by its day, for the single
// line kept below the table; the columns are too narrow for messages.
function weekError(errors: FormErrors): string | undefined {
  for (const day of WEEK) {
    const prefix = `openingHours.${day}`;
    const message = Object.entries(errors).find(
      ([field]) => field === prefix || field.startsWith(`${prefix}.`),
    )?.[1];
    if (message) return `${capitalize(DAY_NAMES[day])}: ${message}`;
  }
  return undefined;
}

// A table with a column per day of the week and a row per interval; a day
// without intervals is closed. The last row has the add button of each
// day.
export function OpeningHoursInput({
  value,
  errors,
  onChange,
}: OpeningHoursInputProps) {
  const rows = Math.max(1, ...WEEK.map((day) => value[day].length));

  function setDay(day: Weekday, intervals: TimeInterval[]) {
    onChange({ ...value, [day]: intervals });
  }

  function cell(day: Weekday, index: number) {
    const intervals = value[day];
    const interval = intervals[index];
    if (!interval) {
      return index === 0 ? (
        <span className="admin-hours-closed">Fechado</span>
      ) : null;
    }

    const name = capitalize(DAY_NAMES[day]);
    const field = `openingHours.${day}.${index}`;
    const update = (change: Partial<TimeInterval>) =>
      setDay(
        day,
        intervals.map((item, position) =>
          position === index ? { ...item, ...change } : item,
        ),
      );

    return (
      <div className="admin-hours-interval">
        <input
          type="time"
          aria-label={`${name}, intervalo ${index + 1}: abre`}
          aria-invalid={field in errors || `${field}.opens` in errors}
          value={interval.opens}
          onChange={(event) => update({ opens: event.target.value })}
        />
        <span aria-hidden="true">às</span>
        <input
          type="time"
          aria-label={`${name}, intervalo ${index + 1}: fecha`}
          aria-invalid={field in errors || `${field}.closes` in errors}
          value={interval.closes}
          onChange={(event) => update({ closes: event.target.value })}
        />
        <button
          type="button"
          className="admin-icon-button admin-icon-button-quiet admin-icon-button-small"
          aria-label={`Remover intervalo ${index + 1} de ${DAY_NAMES[day]}`}
          title="Remover intervalo"
          onClick={() =>
            setDay(
              day,
              intervals.filter((_, position) => position !== index),
            )
          }
        >
          <TrashIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="admin-hours">
      {/* On narrow screens the table scrolls inside its box, not the page. */}
      <div className="admin-hours-wrapper">
        <table className="admin-hours-table">
          <thead>
            <tr>
              {WEEK.map((day) => (
                <th key={day} scope="col">
                  {capitalize(DAY_NAMES[day])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index}>
                {WEEK.map((day) => (
                  <td key={day}>{cell(day, index)}</td>
                ))}
              </tr>
            ))}
            <tr>
              {WEEK.map((day) => (
                <td key={day}>
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button-small"
                    aria-label={`Adicionar intervalo em ${DAY_NAMES[day]}`}
                    title="Adicionar intervalo"
                    onClick={() =>
                      setDay(day, [...value[day], { opens: '', closes: '' }])
                    }
                  >
                    <PlusIcon />
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="admin-field-error">{weekError(errors)}</p>
    </div>
  );
}
