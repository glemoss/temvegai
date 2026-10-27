import 'leaflet/dist/leaflet.css';
import {
  divIcon,
  type LatLngBounds,
  type LatLngTuple,
  type Map as LeafletMap,
} from 'leaflet';
import { useEffect, useRef, type RefObject } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapBounds, Restaurant, RestaurantType } from './api/restaurants';
import { pinSvg } from './leaf';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

// A neighborhood with a single restaurant, or a single restaurant chosen
// in the search, has an area of one point, which would zoom the map all
// the way in.
const FOCUS_MAX_ZOOM = 16;
const FOCUS_PADDING = 32;

// On narrow screens the details panel covers the bottom of the map, up to
// 60% of its height (see RestaurantDetails). The selected restaurant's pin
// tip goes this far below the header, but stays above the panel.
const NARROW_SCREEN = '(width < 40rem)';
const DETAILS_MAX_HEIGHT = 0.6;
const PIN_GAP_BELOW_HEADER_REM = 10;
const PIN_MARGIN_ABOVE_DETAILS = 16;

// Keeps the selected restaurant's pin in front of the pins around it.
const SELECTED_Z_INDEX_OFFSET = 1000;

// One pin per restaurant type, anchored at its tip, and a highlighted one
// for the selected restaurant.
const markerIcons: Record<RestaurantType, ReturnType<typeof divIcon>> = {
  fully_vegan: pinIcon('fully_vegan', false),
  vegan_options: pinIcon('vegan_options', false),
};
const selectedMarkerIcons: Record<
  RestaurantType,
  ReturnType<typeof divIcon>
> = {
  fully_vegan: pinIcon('fully_vegan', true),
  vegan_options: pinIcon('vegan_options', true),
};

function pinIcon(type: RestaurantType, selected: boolean) {
  return divIcon({
    html: pinSvg(type, selected),
    className: selected ? 'pin-marker pin-marker-selected' : 'pin-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 41],
  });
}

// Skips the map's zoom and pan animations for people who ask the system
// for less motion.
function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  );
}

// The height, from the top of the map, where the selected restaurant's pin
// tip goes on narrow screens.
export function selectedPinY({
  mapHeight,
  headerBottom,
  remSize,
}: {
  mapHeight: number;
  headerBottom: number;
  remSize: number;
}): number {
  return Math.min(
    headerBottom + PIN_GAP_BELOW_HEADER_REM * remSize,
    detailsTop(mapHeight) - PIN_MARGIN_ABOVE_DETAILS,
  );
}

function detailsTop(mapHeight: number): number {
  return mapHeight * (1 - DETAILS_MAX_HEIGHT);
}

// Where the selected pin tip goes on this map, or undefined on wide
// screens, where the details panel is on the side.
function pinYAboveDetails(
  map: LeafletMap,
  header: HTMLElement | null,
): number | undefined {
  if (!header || !window.matchMedia?.(NARROW_SCREEN)?.matches) {
    return undefined;
  }
  const mapTop = map.getContainer().getBoundingClientRect().top;
  return selectedPinY({
    mapHeight: map.getSize().y,
    headerBottom: header.getBoundingClientRect().bottom - mapTop,
    remSize:
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
  });
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
// view when `bounds` is cleared. When `bounds` is the selected restaurant,
// narrow screens put it above the details panel instead of in the middle.
function FocusBounds({
  bounds,
  isSelected,
  headerRef,
}: {
  bounds: MapBounds | undefined;
  isSelected: boolean;
  headerRef: RefObject<HTMLElement | null>;
}) {
  const map = useMap();
  const hadBounds = useRef(false);

  useEffect(() => {
    if (bounds) {
      const pinY = isSelected
        ? pinYAboveDetails(map, headerRef.current)
        : undefined;
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        {
          maxZoom: FOCUS_MAX_ZOOM,
          padding: [FOCUS_PADDING, FOCUS_PADDING],
          // A larger bottom padding moves the point up from the middle
          // to `pinY`.
          ...(pinY !== undefined && {
            paddingBottomRight: [
              FOCUS_PADDING,
              map.getSize().y + FOCUS_PADDING - 2 * pinY,
            ],
          }),
          animate: !prefersReducedMotion(),
        },
      );
    } else if (hadBounds.current) {
      map.setView(FLORIANOPOLIS_CENTER, INITIAL_ZOOM, {
        animate: !prefersReducedMotion(),
      });
    }
    hadBounds.current = bounds !== undefined;
  }, [map, bounds, isSelected, headerRef]);

  return null;
}

interface RestaurantMarkersProps {
  restaurants: Restaurant[];
  selectedId: string | undefined;
  headerRef: RefObject<HTMLElement | null>;
  onSelect: (restaurant: Restaurant) => void;
}

// On narrow screens, a clicked pin that the details panel would cover is
// moved up to where a restaurant chosen in the search goes.
function RestaurantMarkers({
  restaurants,
  selectedId,
  headerRef,
  onSelect,
}: RestaurantMarkersProps) {
  const map = useMap();

  function select(restaurant: Restaurant) {
    onSelect(restaurant);
    const pinY = pinYAboveDetails(map, headerRef.current);
    if (pinY === undefined) return;
    const tipY = map.latLngToContainerPoint([
      restaurant.latitude,
      restaurant.longitude,
    ]).y;
    if (tipY > detailsTop(map.getSize().y) - PIN_MARGIN_ABOVE_DETAILS) {
      map.panBy([0, tipY - pinY], { animate: !prefersReducedMotion() });
    }
  }

  return restaurants.map((restaurant) => {
    const selected = restaurant.id === selectedId;
    return (
      <Marker
        key={restaurant.id}
        position={[restaurant.latitude, restaurant.longitude]}
        icon={(selected ? selectedMarkerIcons : markerIcons)[restaurant.type]}
        zIndexOffset={selected ? SELECTED_Z_INDEX_OFFSET : 0}
        title={restaurant.name}
        eventHandlers={{ click: () => select(restaurant) }}
      />
    );
  });
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  focusBounds: MapBounds | undefined;
  // Whether `focusBounds` is the selected restaurant.
  focusIsSelected: boolean;
  selectedId: string | undefined;
  // The header over the map, below which the selected pin is placed on
  // narrow screens.
  headerRef: RefObject<HTMLElement | null>;
  onSelect: (restaurant: Restaurant) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function RestaurantMap({
  restaurants,
  focusBounds,
  focusIsSelected,
  selectedId,
  headerRef,
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
      <FocusBounds
        bounds={focusBounds}
        isSelected={focusIsSelected}
        headerRef={headerRef}
      />
      <RestaurantMarkers
        restaurants={restaurants}
        selectedId={selectedId}
        headerRef={headerRef}
        onSelect={onSelect}
      />
    </MapContainer>
  );
}
