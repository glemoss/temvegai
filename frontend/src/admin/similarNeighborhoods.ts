import { normalize } from '../normalize';

// Words that do not make two neighborhoods alike, as in "Lagoa da
// Conceição" and "Saco dos Limões".
const CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

function words(name: string): string[] {
  return normalize(name)
    .split(/\s+/)
    .filter((word) => word && !CONNECTORS.has(word));
}

// The spelling already registered for a name that matches apart from case
// and accents, or null when the name is new.
export function registeredSpelling(
  name: string,
  registered: string[],
): string | null {
  const wanted = normalize(name.trim());
  return registered.find((item) => normalize(item) === wanted) ?? null;
}

// The registered neighborhoods that share a word with a new one, so
// "Trindade Norte" brings up "Trindade".
export function similarNeighborhoods(
  name: string,
  registered: string[],
): string[] {
  const wanted = new Set(words(name));
  return registered.filter((item) =>
    words(item).some((word) => wanted.has(word)),
  );
}
