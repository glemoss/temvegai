import 'leaflet/dist/leaflet.css';
import { divIcon, type LatLngTuple } from 'leaflet';
import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Coordinates } from '../api/geocoding';
import type { RestaurantType } from '../api/restaurants';
import { pinSvg } from '../leaf';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;
// Close enough to see the street of the pin.
const PIN_ZOOM = 16;

// About 10 cm, more than enough to place a restaurant.
const DECIMALS = 6;

const pinIcons: Record<RestaurantType, ReturnType<typeof divIcon>> = {
  fully_vegan: pinIcon('fully_vegan'),
  vegan_options: pinIcon('vegan_options'),
};

// The same pin as the public map, anchored at its tip.
function pinIcon(type: RestaurantType) {
  return divIcon({
    html: pinSvg(type),
    className: 'pin-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 41],
  });
}

function ClickToPick({ onPick }: { onPick: (location: Coordinates) => void }) {
  useMapEvents({
    click: (event) => {
      // Zoomed far out, the world repeats and longitudes go past ±180.
      const { lat, lng } = event.latlng.wrap();
      onPick({
        latitude: Number(lat.toFixed(DECIMALS)),
        longitude: Number(lng.toFixed(DECIMALS)),
      });
    },
  });
  return null;
}

// Centers the map on the pin whenever it moves, whether by a click, by
// the address or by typing the coordinates, zoomed in to the street. Once
// zoomed in, a click that adjusts the pin leaves the map where it is.
function FollowPin({ value }: { value: Coordinates | null }) {
  const map = useMap();
  const latitude = value?.latitude;
  const longitude = value?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const visible = map.getBounds().contains([latitude, longitude]);
    if (!visible || map.getZoom() < PIN_ZOOM) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), PIN_ZOOM));
    }
  }, [map, latitude, longitude]);

  return null;
}

interface LocationPickerProps {
  value: Coordinates | null;
  type: RestaurantType;
  onChange: (location: Coordinates) => void;
}

// A map of Florianópolis where a click places the restaurant's pin.
export function LocationPicker({ value, type, onChange }: LocationPickerProps) {
  return (
    <MapContainer
      center={FLORIANOPOLIS_CENTER}
      zoom={INITIAL_ZOOM}
      // Isolated, so the map panes stay below the modal header.
      className="isolate h-72 cursor-crosshair rounded-md border"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickToPick onPick={onChange} />
      <FollowPin value={value} />
      {value && (
        <Marker
          position={[value.latitude, value.longitude]}
          icon={pinIcons[type]}
          interactive={false}
        />
      )}
    </MapContainer>
  );
}
