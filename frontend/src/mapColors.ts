import type { Map as MaplibreMap } from 'maplibre-gl';

type ColorProperty =
  | 'background-color'
  | 'fill-color'
  | 'line-color'
  | 'text-color'
  | 'text-halo-color';

// Colors that replace the ones of the CARTO Voyager style, for the layers
// whose names match. The layer names come from the style itself, and
// Maputnik shows them when the style is opened there. The palette follows
// the MapTiler Basic style (github.com/openmaptiles/maptiler-basic-gl-style,
// design under CC-BY 4.0, © MapTiler): a beige ground, white roads without
// the yellow of the main ones, green parks, blue water and gray labels.
export const MAP_COLORS: {
  layers: RegExp;
  property: ColorProperty;
  color: string;
}[] = [
  { layers: /^background$/, property: 'background-color', color: '#e8e5d8' },
  { layers: /^landuse_residential$/, property: 'fill-color', color: '#e0ded7' },
  // Parks, woods and nature reserves.
  {
    layers: /^(landcover|park_national_park|park_nature_reserve)$/,
    property: 'fill-color',
    color: '#c0d897',
  },
  // The sea, lakes and rivers.
  { layers: /^water(_shadow)?$/, property: 'fill-color', color: '#94c1e1' },
  { layers: /^waterway$/, property: 'line-color', color: '#94c1e1' },
  // Roads, bridges and tunnels: white, with an edge close to the ground.
  {
    layers: /^(road|bridge|tunnel)_.*_fill/,
    property: 'line-color',
    color: '#ffffff',
  },
  {
    layers: /^(road|bridge|tunnel)_.*_case/,
    property: 'line-color',
    color: '#d9d5c7',
  },
  { layers: /^(tunnel_)?rail$/, property: 'line-color', color: '#b3aa9e' },
  { layers: /^building(-top)?$/, property: 'fill-color', color: '#ded3be' },
  // Names of places and streets.
  { layers: /^place_/, property: 'text-color', color: '#404040' },
  { layers: /^place_/, property: 'text-halo-color', color: '#ffffff' },
  { layers: /^roadname_/, property: 'text-color', color: '#333333' },
  { layers: /^roadname_/, property: 'text-halo-color', color: '#ffffff' },
];

// Only the layers the style has are changed, so a layer CARTO renames
// keeps its original color instead of breaking the map.
export function applyMapColors(
  map: Pick<MaplibreMap, 'getStyle' | 'setPaintProperty'>,
) {
  const layerIds = map.getStyle().layers.map((layer) => layer.id);

  for (const { layers, property, color } of MAP_COLORS) {
    for (const id of layerIds.filter((layerId) => layers.test(layerId))) {
      map.setPaintProperty(id, property, color);
    }
  }
}
