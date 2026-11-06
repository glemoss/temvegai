import 'leaflet/dist/leaflet.css';
import {
  divIcon,
  type LatLngBounds,
  type LatLngTuple,
  type Map as LeafletMap,
} from 'leaflet';
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapBounds, Restaurant, RestaurantType } from './api/restaurants';
import { CartoBasemap } from './CartoBasemap';
import { pinSvg } from './leaf';
import { UserLocationControl } from './UserLocationControl';
import { useUserLocation, type UserPosition } from './useUserLocation';

const FLORIANOPOLIS_CENTER: LatLngTuple = [-27.5954, -48.548];
const INITIAL_ZOOM = 12;

// A neighborhood with a single restaurant, or a single restaurant chosen
// in the search, has an area of one point, which would zoom the map all
// the way in.
const FOCUS_MAX_ZOOM = 16;
const FOCUS_PADDING = 32;

// The details panel covers the bottom of the map on narrow screens, up to
// 60% of its height, and its right side on wide screens (see
// RestaurantDetails). The selected restaurant goes to the middle of what
// is left below the header.
const NARROW_SCREEN = '(width < 40rem)';
const DETAILS_MAX_HEIGHT = 0.6;
const DETAILS_WIDTH_REM = 24;

// The visitor's location: a dot of a fixed size and, around it, how far
// off it may be.
const USER_LOCATION_COLOR = '#1a73e8';

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

// The part of the map, in pixels from its top left corner, that is not
// behind the header or, when it is open, the details panel.
export function visibleArea({
  mapWidth,
  mapHeight,
  headerBottom,
  remSize,
  narrow,
  detailsOpen = true,
}: {
  mapWidth: number;
  mapHeight: number;
  headerBottom: number;
  remSize: number;
  narrow: boolean;
  detailsOpen?: boolean;
}): { left: number; top: number; right: number; bottom: number } {
  const narrowPanel = detailsOpen && narrow;
  const widePanel = detailsOpen && !narrow;
  return {
    left: 0,
    top: headerBottom,
    right: widePanel ? mapWidth - DETAILS_WIDTH_REM * remSize : mapWidth,
    bottom: narrowPanel ? mapHeight * (1 - DETAILS_MAX_HEIGHT) : mapHeight,
  };
}

function mapVisibleArea(
  map: LeafletMap,
  header: HTMLElement | null,
  detailsOpen = true,
) {
  const size = map.getSize();
  const mapTop = map.getContainer().getBoundingClientRect().top;
  return visibleArea({
    mapWidth: size.x,
    mapHeight: size.y,
    headerBottom: header ? header.getBoundingClientRect().bottom - mapTop : 0,
    remSize:
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
    narrow: window.matchMedia?.(NARROW_SCREEN)?.matches ?? false,
    detailsOpen,
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
// it goes to the middle of the area the details panel leaves visible.
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
      const area = isSelected
        ? mapVisibleArea(map, headerRef.current)
        : undefined;
      const size = map.getSize();
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        {
          maxZoom: FOCUS_MAX_ZOOM,
          padding: [FOCUS_PADDING, FOCUS_PADDING],
          // Leaflet centers the bounds in what the padding leaves.
          ...(area && {
            paddingTopLeft: [area.left, area.top],
            paddingBottomRight: [size.x - area.right, size.y - area.bottom],
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

// The visitor's location, once the button asks for it. The map goes to
// it, in the middle of the area left visible, only when the button is
// clicked, so following the visitor does not fight someone dragging the
// map; it zooms in to the street unless it is already closer.
function UserLocation({
  detailsOpen,
  headerRef,
}: {
  detailsOpen: boolean;
  headerRef: RefObject<HTMLElement | null>;
}) {
  const map = useMap();
  const { state, locate } = useUserLocation();
  // Whether the map still has to go to the location, which the browser
  // may take a while to find after the click.
  const goPending = useRef(false);
  const position = state.status === 'located' ? state.position : null;

  function goTo({ latitude, longitude }: UserPosition) {
    const zoom = Math.max(map.getZoom(), FOCUS_MAX_ZOOM);
    const area = mapVisibleArea(map, headerRef.current, detailsOpen);
    const size = map.getSize();
    // Where the map's center must be for the location to land in the
    // middle of the visible area.
    const center = map.unproject(
      map
        .project([latitude, longitude], zoom)
        .add([
          size.x / 2 - (area.left + area.right) / 2,
          size.y / 2 - (area.top + area.bottom) / 2,
        ]),
      zoom,
    );
    map.setView(center, zoom, { animate: !prefersReducedMotion() });
  }

  const goToPending = useEffectEvent((found: UserPosition) => {
    if (!goPending.current) return;
    goPending.current = false;
    goTo(found);
  });

  useEffect(() => {
    if (position) goToPending(position);
  }, [position]);

  function handleLocate() {
    if (position) {
      goTo(position);
      return;
    }
    goPending.current = true;
    locate();
  }

  return (
    <>
      <UserLocationControl status={state.status} onLocate={handleLocate} />
      {position && (
        <>
          <Circle
            center={[position.latitude, position.longitude]}
            radius={position.accuracy}
            interactive={false}
            pathOptions={{
              stroke: false,
              fillColor: USER_LOCATION_COLOR,
              fillOpacity: 0.15,
            }}
          />
          <CircleMarker
            center={[position.latitude, position.longitude]}
            radius={7}
            interactive={false}
            pathOptions={{
              color: '#fff',
              weight: 3,
              fillColor: USER_LOCATION_COLOR,
              fillOpacity: 1,
            }}
          />
        </>
      )}
    </>
  );
}

interface RestaurantMarkersProps {
  restaurants: Restaurant[];
  selectedId: string | undefined;
  headerRef: RefObject<HTMLElement | null>;
  onSelect: (restaurant: Restaurant) => void;
}

// A clicked pin moves, without changing the zoom, to where a restaurant
// chosen in the search goes.
function RestaurantMarkers({
  restaurants,
  selectedId,
  headerRef,
  onSelect,
}: RestaurantMarkersProps) {
  const map = useMap();

  function select(restaurant: Restaurant) {
    onSelect(restaurant);
    const area = mapVisibleArea(map, headerRef.current);
    const tip = map.latLngToContainerPoint([
      restaurant.latitude,
      restaurant.longitude,
    ]);
    map.panBy(
      [
        tip.x - (area.left + area.right) / 2,
        tip.y - (area.top + area.bottom) / 2,
      ],
      { animate: !prefersReducedMotion() },
    );
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
  // The header over the map, below which the selected pin is placed.
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
      {/* CARTO Voyager: OpenStreetMap data in soft colors and with fewer
        details, so the pins stand out. */}
      <CartoBasemap />
      <BoundsWatcher onChange={onBoundsChange} />
      <FocusBounds
        bounds={focusBounds}
        isSelected={focusIsSelected}
        headerRef={headerRef}
      />
      <UserLocation
        detailsOpen={selectedId !== undefined}
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
