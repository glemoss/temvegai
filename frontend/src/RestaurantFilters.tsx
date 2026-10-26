import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import type { Neighborhood } from './api/neighborhoods';
import type { Restaurant, RestaurantType } from './api/restaurants';
import { RestaurantSearch } from './RestaurantSearch';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

// The label above each select, and the select itself, as tall as the
// search field.
const FILTER_LABEL =
  'flex min-w-0 flex-1 flex-col gap-1 text-[0.8125rem] font-semibold text-muted-foreground';
const FILTER_SELECT =
  'h-10 rounded-sm bg-card pl-2.5 text-base font-normal text-foreground md:text-base';

interface RestaurantFiltersProps {
  type: RestaurantType | undefined;
  neighborhood: string | undefined;
  name: string;
  // `null` while the list is loading or when it could not be loaded.
  neighborhoods: Neighborhood[] | null;
  onTypeChange: (type: RestaurantType | undefined) => void;
  onNeighborhoodChange: (neighborhood: string | undefined) => void;
  onNameChange: (name: string) => void;
  onNameSubmit: () => void;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

export function RestaurantFilters({
  type,
  neighborhood,
  name,
  neighborhoods,
  onTypeChange,
  onNeighborhoodChange,
  onNameChange,
  onNameSubmit,
  onRestaurantSelect,
}: RestaurantFiltersProps) {
  // Type and neighborhood start hidden behind a toggle, so the header
  // covers as little of the map as possible.
  const [expanded, setExpanded] = useState(false);
  const moreFiltersId = useId();
  const activeCount = (type ? 1 : 0) + (neighborhood ? 1 : 0);
  const label = activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros';

  return (
    <form
      className="flex flex-col gap-2"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-end gap-2">
        <RestaurantSearch
          value={name}
          onChange={onNameChange}
          onSubmit={onNameSubmit}
          onSelect={onRestaurantSelect}
        />
        <Button
          type="button"
          size="icon-lg"
          className="relative hover:bg-secondary-foreground [&_svg:not([class*='size-'])]:size-5"
          aria-expanded={expanded}
          aria-controls={moreFiltersId}
          aria-label={label}
          title={label}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal aria-hidden="true" />
          {/* How many filters are active, on the button's corner. */}
          {activeCount > 0 && (
            <Badge
              className="absolute -top-1.5 -right-1.5 h-[1.15rem] min-w-[1.15rem] border-2 border-card bg-ring px-1 text-secondary-foreground"
              aria-hidden="true"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>
      <div
        id={moreFiltersId}
        className={cn('flex gap-2', !expanded && 'hidden')}
      >
        <label className={FILTER_LABEL}>
          Tipo
          <NativeSelect
            wrapperClassName="w-full"
            className={FILTER_SELECT}
            value={type ?? ''}
            onChange={(event) =>
              onTypeChange(
                (event.target.value || undefined) as RestaurantType | undefined,
              )
            }
          >
            <NativeSelectOption value="">Todos os tipos</NativeSelectOption>
            {TYPES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {TYPE_LABELS[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className={FILTER_LABEL}>
          Bairro
          <NativeSelect
            wrapperClassName="w-full"
            className={FILTER_SELECT}
            value={neighborhood ?? ''}
            disabled={!neighborhoods}
            onChange={(event) =>
              onNeighborhoodChange(event.target.value || undefined)
            }
          >
            <NativeSelectOption value="">Todos os bairros</NativeSelectOption>
            {neighborhoods?.map(({ name }) => (
              <NativeSelectOption key={name} value={name}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
    </form>
  );
}
