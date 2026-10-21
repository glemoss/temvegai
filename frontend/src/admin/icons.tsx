// Icons of the panel's buttons, drawn with the text color. Decorative:
// the buttons carry their names in aria-label.

export function PlusIcon() {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The "Delete" icon of Material Design, as Material UI draws it (Apache
// License 2.0), filled with the text color.
export function TrashIcon() {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
