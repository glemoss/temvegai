import 'leaflet/dist/leaflet.css';
import { divIcon, type LatLngBounds, type LatLngTuple } from 'leaflet';
import { useEffect, useRef } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapBounds, Restaurant, RestaurantType } from './api/restaurants';
import { leafSvg } from './leaf';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

// A neighborhood with a single restaurant, or a single restaurant chosen
// in the search, has an area of one point, which would zoom the map all
// the way in.
const FOCUS_MAX_ZOOM = 16;

// One leaf per restaurant type, anchored at the tip of its stem.
const markerIcons: Record<RestaurantType, ReturnType<typeof divIcon>> = {
  fully_vegan: leafIcon('fully_vegan'),
  vegan_options: leafIcon('vegan_options'),
};

function leafIcon(type: RestaurantType) {
  return divIcon({
    html: leafSvg(type),
    className: 'leaf-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
}

// Skips the map's zoom and pan animations for people who ask the system
// for less motion.
function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  );
}

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
        {
          maxZoom: FOCUS_MAX_ZOOM,
          padding: [32, 32],
          animate: !prefersReducedMotion(),
        },
      );
    } else if (hadBounds.current) {
      map.setView(FLORIANOPOLIS_CENTER, INITIAL_ZOOM, {
        animate: !prefersReducedMotion(),
      });
    }
    hadBounds.current = bounds !== undefined;
  }, [map, bounds]);

  return null;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  focusBounds: MapBounds | undefined;
  onSelect: (restaurant: Restaurant) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function RestaurantMap({
  restaurants,
  focusBounds,
  onSelect,
  onBoundsChange,
}: RestaurantMapProps) {
  const animate = !prefersReducedMotion();

  return (
    <MapContainer
      center={FLORIANOPOLIS_CENTER}
      zoom={INITIAL_ZOOM}
      className="restaurant-map"
      // On narrow screens the header spans the top of the map, where
      // Leaflet puts the zoom buttons by default, and the legend takes the
      // bottom right corner.
      zoomControl={false}
      zoomAnimation={animate}
      fadeAnimation={animate}
      markerZoomAnimation={animate}
    >
      <ZoomControl
        position="bottomleft"
        zoomInTitle="Aproximar"
        zoomOutTitle="Afastar"
      />
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
          icon={markerIcons[restaurant.type]}
          title={restaurant.name}
          eventHandlers={{ click: () => onSelect(restaurant) }}
        />
      ))}
    </MapContainer>
  );
}
