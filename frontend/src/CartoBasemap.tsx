import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { config } from './config';
import { applyMapColors } from './mapColors';

// MapLibre looks for its worker next to its own file, which Vite moves
// when it bundles the dependencies, so the worker URL is given here.
setWorkerUrl(workerUrl);

// The official CARTO Voyager vector style, which CARTO keeps up to date.
export const CARTO_STYLE_URL = `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=${encodeURIComponent(config.cartoKey)}`;

// CARTO Voyager drawn by MapLibre inside the Leaflet map, with the colors
// of mapColors.ts. The credits of OpenStreetMap and CARTO come from the
// style and go to the Leaflet attribution.
export function CartoBasemap() {
  const map = useMap();

  useEffect(() => {
    const layer = maplibreGL({ style: CARTO_STYLE_URL }).addTo(map);
    const glMap = layer.getMaplibreMap();
    glMap.on('style.load', () => applyMapColors(glMap));

    return () => {
      layer.remove();
    };
  }, [map]);

  return null;
}
