import type { RestaurantType } from './api/restaurants';
import { PinIcon } from './leaf';
import { TYPE_LABELS } from './restaurantTypeLabels';

const TYPES = Object.keys(TYPE_LABELS) as RestaurantType[];

export function MapLegend() {
  return (
    <ul className="map-legend" aria-label="Legenda do mapa">
      {TYPES.map((type) => (
        <li key={type}>
          <PinIcon type={type} className="pin-icon" />
          {TYPE_LABELS[type]}
        </li>
      ))}
    </ul>
  );
}
