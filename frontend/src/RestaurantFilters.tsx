import type { Neighborhood } from './api/neighborhoods';
import type { RestaurantType } from './api/restaurants';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

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
  return (
    <form
      className="restaurant-filters"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        Nome
        <input
          type="search"
          value={name}
          placeholder="Buscar restaurante"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>
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
    </form>
  );
}
