import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TimeInterval, Weekday, WeeklyHours } from '../api/restaurants';
import { DAY_NAMES, WEEK } from '../openingHoursSchedule';
import type { FormErrors } from './restaurantFormSchema';

interface OpeningHoursInputProps {
  value: WeeklyHours;
  errors: FormErrors;
  onChange: (value: WeeklyHours) => void;
}

// The opening above the closing, centered in the narrow column. Chrome's
// clock button is hidden, since the time is typed in the field, and the
// value stays a block so it follows the field's text-align.
const TIME_INPUT =
  'h-8 px-1 text-center text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:inline-block';

// One column per day, divided by lines.
const CELL = 'px-1 py-2 text-center align-top not-first:border-l';

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
        <span className="block py-2 text-sm text-muted-foreground">
          Fechado
        </span>
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
      <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
        <Input
          type="time"
          className={TIME_INPUT}
          aria-label={`${name}, intervalo ${index + 1}: abre`}
          aria-invalid={field in errors || `${field}.opens` in errors}
          value={interval.opens}
          onChange={(event) => update({ opens: event.target.value })}
        />
        <span aria-hidden="true">às</span>
        <Input
          type="time"
          className={TIME_INPUT}
          aria-label={`${name}, intervalo ${index + 1}: fecha`}
          aria-invalid={field in errors || `${field}.closes` in errors}
          value={interval.closes}
          onChange={(event) => update({ closes: event.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={`Remover intervalo ${index + 1} de ${DAY_NAMES[day]}`}
          title="Remover intervalo"
          onClick={() =>
            setDay(
              day,
              intervals.filter((_, position) => position !== index),
            )
          }
        >
          <Trash2 />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      {/* On narrow screens the table scrolls inside its box, not the page. */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[42rem] table-fixed border-collapse">
          <thead>
            <tr>
              {WEEK.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={`${CELL} border-b text-sm text-muted-foreground`}
                >
                  {capitalize(DAY_NAMES[day])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr+tr>td]:border-t [&>tr+tr>td]:border-dashed">
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index}>
                {WEEK.map((day) => (
                  <td key={day} className={CELL}>
                    {cell(day, index)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              {WEEK.map((day) => (
                <td key={day} className={CELL}>
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label={`Adicionar intervalo em ${DAY_NAMES[day]}`}
                    title="Adicionar intervalo"
                    onClick={() =>
                      setDay(day, [...value[day], { opens: '', closes: '' }])
                    }
                  >
                    <Plus />
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="min-h-[1.4em] text-sm leading-[1.4] font-semibold text-destructive">
        {weekError(errors)}
      </p>
    </div>
  );
}
