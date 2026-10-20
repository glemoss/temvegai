import { useId, useState } from 'react';
import type { Neighborhood } from './api/neighborhoods';
import type { RestaurantType } from './api/restaurants';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

// Three sliders, the usual sign for filter settings.
function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

interface RestaurantFiltersProps {
  type: RestaurantType | undefined;
  neighborhood: string | undefined;
  name: string;
  // `null` while the list is loading or when it could not be loaded.
  neighborhoods: Neighborhood[] | null;
  onTypeChange: (type: RestaurantType | undefined) => void;
  onNeighborhoodChange: (neighborhood: string | undefined) => void;
  onNameChange: (name: string) => void;
}

export function RestaurantFilters({
  type,
  neighborhood,
  name,
  neighborhoods,
  onTypeChange,
  onNeighborhoodChange,
  onNameChange,
}: RestaurantFiltersProps) {
  // Type and neighborhood start hidden behind a toggle, so the header
  // covers as little of the map as possible.
  const [expanded, setExpanded] = useState(false);
  const moreFiltersId = useId();
  const activeCount = (type ? 1 : 0) + (neighborhood ? 1 : 0);
  const label = activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros';

  return (
    <form
      className="restaurant-filters"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="restaurant-filters-main">
        <label>
          {/* The placeholder already says what the field is for; the label
              stays for screen readers. */}
          <span className="visually-hidden">Nome</span>
          <input
            type="search"
            value={name}
            placeholder="Buscar restaurante"
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="restaurant-filters-toggle"
          aria-expanded={expanded}
          aria-controls={moreFiltersId}
          aria-label={label}
          title={label}
          onClick={() => setExpanded(!expanded)}
        >
          <FilterIcon />
          {activeCount > 0 && (
            <span className="restaurant-filters-count" aria-hidden="true">
              {activeCount}
            </span>
          )}
        </button>
      </div>
      <div
        id={moreFiltersId}
        className="restaurant-filters-more"
        data-expanded={expanded}
      >
        <label>
          Tipo
          <select
            value={type ?? ''}
            onChange={(event) =>
              onTypeChange(
                (event.target.value || undefined) as RestaurantType | undefined,
              )
            }
          >
            <option value="">Todos os tipos</option>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bairro
          <select
            value={neighborhood ?? ''}
            disabled={!neighborhoods}
            onChange={(event) =>
              onNeighborhoodChange(event.target.value || undefined)
            }
          >
            <option value="">Todos os bairros</option>
            {neighborhoods?.map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
