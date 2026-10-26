import type { RestaurantType } from './api/restaurants';

// A leaf with its midrib cut out, tip at the top right, in a 24×24 box.
const LEAF_VIEW_BOX = '0 0 24 24';
const LEAF = 'M5 20C3 12 9 4.5 20.5 4C21 14 15.5 20.5 5 20Z';
const MIDRIB = 'M5.5 19.5C8 14 11.5 10 16 7.5';

// A map pin with the leaf in a white circle, in a 32×42 box, with the tip
// of the pin at the bottom center so it sits exactly on the restaurant's
// coordinates.
const PIN_VIEW_BOX = '0 0 32 42';
const PIN = 'M16 41C16 41 3 27 3 15.5A13 13 0 0 1 29 15.5C29 27 16 41 16 41Z';
const PIN_CIRCLE = { cx: 16, cy: 15.5, r: 9.5 };
// Fits the 24×24 leaf into a 15×15 square centered in the circle.
const PIN_LEAF_TRANSFORM = 'translate(8.5 8) scale(0.625)';

const GREEN = '#2f6b3a';
const DARK_GREEN = '#1f4d2b';
const WHITE = '#ffffff';

// Fully vegan places get a solid leaf; places with vegan options get an
// outlined one, so the two differ by shape and not only by color. The pin
// around the leaf is the same for both.
function leafMarkup(type: RestaurantType): string {
  if (type === 'fully_vegan') {
    return (
      `<path d="${LEAF}" fill="${GREEN}"/>` +
      `<path d="${MIDRIB}" fill="none" stroke="${WHITE}" stroke-width="1.8" stroke-linecap="round"/>`
    );
  }
  return (
    `<path d="${LEAF}" fill="${WHITE}" stroke="${GREEN}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${MIDRIB}" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>`
  );
}

function pinMarkup(type: RestaurantType): string {
  const { cx, cy, r } = PIN_CIRCLE;
  return (
    `<path d="${PIN}" fill="${GREEN}" stroke="${DARK_GREEN}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${WHITE}"/>` +
    `<g transform="${PIN_LEAF_TRANSFORM}">${leafMarkup(type)}</g>`
  );
}

// The pin as an SVG string, for Leaflet markers, which take plain HTML.
export function pinSvg(type: RestaurantType): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${PIN_VIEW_BOX}" aria-hidden="true">${pinMarkup(type)}</svg>`;
}

// React version, for the legend, the details panel and the title. It
// reuses the markup above, which is fixed and holds no outside data, so the
// shape is written only once. Decorative: the text next to it carries the
// meaning.
interface IconProps {
  type: RestaurantType;
  className?: string;
}

export function LeafIcon({ type, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox={LEAF_VIEW_BOX}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: leafMarkup(type) }}
    />
  );
}
