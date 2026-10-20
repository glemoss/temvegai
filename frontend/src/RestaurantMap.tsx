import 'leaflet/dist/leaflet.css';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { icon, type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { Restaurant } from './api/restaurants';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

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

interface RestaurantMapProps {
  restaurants: Restaurant[];
}

export function RestaurantMap({ restaurants }: RestaurantMapProps) {
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
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.latitude, restaurant.longitude]}
          icon={markerIcon}
        />
      ))}
    </MapContainer>
  );
}
