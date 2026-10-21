// Lower case and without accents, so "conceicao" finds "Conceição", like
// the `unaccent` search of the API.
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
