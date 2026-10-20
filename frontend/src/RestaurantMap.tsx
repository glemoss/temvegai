import 'leaflet/dist/leaflet.css';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { icon, type LatLngBounds, type LatLngTuple } from 'leaflet';
import { useEffect, useRef } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapBounds, Restaurant } from './api/restaurants';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

// A neighborhood with a single restaurant has an area of one point, which
// would zoom the map all the way in.
const FOCUS_MAX_ZOOM = 16;

// Leaflet finds its default marker images through a path in its CSS, which
// breaks once Vite bundles the files, so the images are imported directly.
const markerIcon = icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Zoomed far out, Leaflet reports longitudes past ±180 as the world
// repeats, which the API rejects.
function toMapBounds(bounds: LatLngBounds): MapBounds {
  return {
    minLat: Math.max(bounds.getSouth(), -90),
    maxLat: Math.min(bounds.getNorth(), 90),
    minLng: Math.max(bounds.getWest(), -180),
    maxLng: Math.min(bounds.getEast(), 180),
  };
}

// Reports the visible area once the map is ready and after every move.
function BoundsWatcher({
  onChange,
}: {
  onChange: (bounds: MapBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => onChange(toMapBounds(map.getBounds())),
  });

  useEffect(() => {
    onChange(toMapBounds(map.getBounds()));
  }, [map, onChange]);

  return null;
}

// Moves the map to `bounds` whenever it changes, and back to the initial
// view when `bounds` is cleared.
function FocusBounds({ bounds }: { bounds: MapBounds | undefined }) {
  const map = useMap();
  const hadBounds = useRef(false);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        { maxZoom: FOCUS_MAX_ZOOM, padding: [32, 32] },
      );
    } else if (hadBounds.current) {
      map.setView(FLORIANOPOLIS_CENTER, INITIAL_ZOOM);
    }
    hadBounds.current = bounds !== undefined;
  }, [map, bounds]);

  return null;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  focusBounds: MapBounds | undefined;
  onSelect: (id: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function RestaurantMap({
  restaurants,
  focusBounds,
  onSelect,
  onBoundsChange,
}: RestaurantMapProps) {
  return (
    <MapContainer
      center={FLORIANOPOLIS_CENTER}
      zoom={INITIAL_ZOOM}
      className="restaurant-map"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <BoundsWatcher onChange={onBoundsChange} />
      <FocusBounds bounds={focusBounds} />
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.latitude, restaurant.longitude]}
          icon={markerIcon}
          title={restaurant.name}
          eventHandlers={{ click: () => onSelect(restaurant.id) }}
        />
      ))}
    </MapContainer>
  );
}
