import type { Restaurant } from '../entities/restaurant.js';
import type { RestaurantDraft } from '../entities/suggestion.js';

// Lowercase, without accents and with single spaces, so spellings that only
// differ in those compare equal.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// The map only has restaurants in the city of Florianópolis. A city the AI
// did not find passes, for the admin to judge from the address in the
// review. The state may come after the name, as in "Florianópolis - SC".
export function isInFlorianopolis(city: string | null): boolean {
  return (
    city === null ||
    normalize(city).replace(/[\s,/-]+sc$/, '') === 'florianopolis'
  );
}

// Without protocol, www and trailing slash, so the same site written in
// different ways compares equal.
function normalizeWebsite(website: string): string {
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

function same(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && a === b;
}

// The registered restaurant the draft describes, if any: same Instagram,
// site or phone, or same name in the same neighborhood. The name alone is
// not enough, since a chain has one restaurant per neighborhood.
export function findRegisteredRestaurant(
  draft: RestaurantDraft,
  restaurants: Restaurant[],
): Restaurant | null {
  return (
    restaurants.find(
      (restaurant) =>
        same(
          draft.instagram?.toLowerCase() ?? null,
          restaurant.instagram?.toLowerCase() ?? null,
        ) ||
        same(
          draft.website && normalizeWebsite(draft.website),
          restaurant.website && normalizeWebsite(restaurant.website),
        ) ||
        same(draft.phone, restaurant.phone) ||
        (normalize(draft.name) === normalize(restaurant.name) &&
          same(
            draft.neighborhood && normalize(draft.neighborhood),
            normalize(restaurant.neighborhood),
          )),
    ) ?? null
  );
}
