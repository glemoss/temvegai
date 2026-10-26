import type { RestaurantType } from './api/restaurants';
import { LeafIcon } from './leaf';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

// Bottom right corner, above the map attribution.
export function MapLegend() {
  return (
    <ul
      className="absolute right-3 bottom-8 z-(--z-overlay) m-0 flex list-none flex-col gap-1.5 rounded-sm bg-card px-3.5 py-2.5 text-[0.9375rem] text-muted-foreground shadow-(--shadow) max-sm:right-2"
      aria-label="Legenda do mapa"
    >
      {TYPES.map((type) => (
        <li key={type} className="flex items-center gap-2">
          <LeafIcon type={type} className="size-6 shrink-0" />
          {TYPE_LABELS[type]}
        </li>
      ))}
    </ul>
  );
}
