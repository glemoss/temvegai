export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// A neighborhood with the smallest area that covers all its restaurants.
export interface Neighborhood {
  name: string;
  bounds: MapBounds;
}

const LOWERCASE_WORDS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

// Capitalizes each word, keeping articles and prepositions lowercase
// unless they come first: "lagoa DA conceição" becomes "Lagoa da Conceição".
export function formatNeighborhoodName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lowercase = word.toLocaleLowerCase('pt-BR');
      if (index > 0 && LOWERCASE_WORDS.has(lowercase)) {
        return lowercase;
      }
      return (
        lowercase.charAt(0).toLocaleUpperCase('pt-BR') + lowercase.slice(1)
      );
    })
    .join(' ');
}
