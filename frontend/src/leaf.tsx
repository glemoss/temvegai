import type { RestaurantType } from './api/restaurants';

// A plain leaf in the style of the usual vegan symbol, standing almost
// upright, with its stem tip at the bottom center of the 32×40 box, so the
// tip can sit exactly on the restaurant's coordinates.
const VIEW_BOX = '0 0 32 40';
const STEM = 'M16 39.5C16 36 15.5 33.5 14.5 31';
const BLADE = 'M14.5 31C5.5 25 6 8.5 25.5 1.5C30.5 17 25 28.5 14.5 31Z';
const MIDRIB = 'M14.5 31C17.5 22.5 20.5 13.5 24.5 5';

// Fully vegan places get a solid leaf; places with vegan options get an
// outlined one, so the two differ by shape and not only by color.
const STYLES: Record<
  RestaurantType,
  { fill: string; stroke: string; midrib: string }
> = {
  fully_vegan: { fill: '#2f6b3a', stroke: '#1f4d2b', midrib: '#e3f1dc' },
  vegan_options: { fill: '#e3f1dc', stroke: '#2f6b3a', midrib: '#2f6b3a' },
};

// The leaf as an SVG string, for Leaflet markers, which take plain HTML.
export function leafSvg(type: RestaurantType): string {
  const { fill, stroke, midrib } = STYLES[type];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}" aria-hidden="true">` +
    `<path d="${STEM}" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="${BLADE}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${MIDRIB}" fill="none" stroke="${midrib}" stroke-width="1.6" stroke-linecap="round"/>` +
    `</svg>`
  );
}

// The same leaf as a React element, for the legend, the details panel and
// the title. Decorative: the text next to it carries the meaning.
export function LeafIcon({
  type,
  className,
}: {
  type: RestaurantType;
  className?: string;
}) {
  const { fill, stroke, midrib } = STYLES[type];
  return (
    <svg className={className} viewBox={VIEW_BOX} aria-hidden="true">
      <path
        d={STEM}
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={BLADE}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={MIDRIB}
        fill="none"
        stroke={midrib}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
