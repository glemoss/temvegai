import { useId, useState } from 'react';
import { isOpenAt, openingHoursLines } from './openingHoursSchedule';

interface OpeningHoursProps {
  text: string;
}

// Whether the restaurant is open now, with an arrow that shows the full
// hours, one line per "Days: hours" part. Text that does not follow the
// convention has no known state, so it is listed right away.
export function OpeningHours({ text }: OpeningHoursProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const open = isOpenAt(text, new Date());

  const list = (
    <ul
      id={listId}
      className="opening-hours"
      hidden={open !== null && !expanded}
    >
      {openingHoursLines(text).map(({ days, hours }, index) =>
        days ? (
          <li key={index}>
            <span>{days}</span>
            <span>{hours}</span>
          </li>
        ) : (
          <li key={index}>{hours}</li>
        ),
      )}
    </ul>
  );

  if (open === null) {
    return list;
  }

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
      {list}
    </>
  );
}
