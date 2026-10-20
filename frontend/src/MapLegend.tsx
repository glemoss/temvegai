import type { RestaurantType } from './api/restaurants';
import { LeafIcon } from './leaf';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

export function MapLegend() {
  return (
    <ul className="map-legend" aria-label="Legenda do mapa">
      {TYPES.map((type) => (
        <li key={type}>
          <LeafIcon type={type} className="leaf-icon" />
          {TYPE_LABELS[type]}
        </li>
      ))}
    </ul>
  );
}
