import { useId, useState } from 'react';
import type { WeeklyHours } from './api/restaurants';
import { isOpenAt, openingHoursLines } from './openingHoursSchedule';

interface OpeningHoursProps {
  hours: WeeklyHours;
}

// Whether the restaurant is open now, with an arrow that shows the full
// hours, one line per run of days with the same hours.
export function OpeningHours({ hours }: OpeningHoursProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const open = isOpenAt(hours, new Date());

  return (
    <>
      <button
        type="button"
        className="opening-hours-toggle"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span
          className={`opening-hours-status ${open ? 'is-open' : 'is-closed'}`}
        >
          {open ? 'Aberto agora' : 'Fechado agora'}
        </span>
        <svg
          className="opening-hours-arrow"
          viewBox="0 0 12 8"
          aria-hidden="true"
        >
          <path
            d="M1 1.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul id={listId} className="opening-hours" hidden={!expanded}>
        {openingHoursLines(hours).map((line) => (
          <li key={line.days}>
            <span>{line.days}</span>
            <span>{line.hours}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
