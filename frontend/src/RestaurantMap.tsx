import 'leaflet/dist/leaflet.css';
import type { LatLngTuple } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

export function RestaurantMap() {
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
    </MapContainer>
  );
}
