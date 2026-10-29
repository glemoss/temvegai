import { describe, expect, it } from 'vitest';
import { formatNeighborhoodName } from './neighborhood.js';

describe('formatNeighborhoodName', () => {
  it.each([
    ['rio tavares', 'Rio Tavares'],
    ['RIO TAVARES', 'Rio Tavares'],
    ['rIo TaVaReS', 'Rio Tavares'],
  ])('capitalizes each word of %s', (name, expected) => {
    expect(formatNeighborhoodName(name)).toBe(expected);
  });

  it('keeps accented letters in the right case', () => {
    expect(formatNeighborhoodName('ÁGUA VERDE CONCEIÇÃO')).toBe(
      'Água Verde Conceição',
    );
  });

  it('keeps articles and prepositions lowercase after the first word', () => {
    expect(formatNeighborhoodName('lagoa DA conceição')).toBe(
      'Lagoa da Conceição',
    );
    expect(formatNeighborhoodName('SANTO ANTÔNIO DE LISBOA')).toBe(
      'Santo Antônio de Lisboa',
    );
    expect(formatNeighborhoodName('ingleses DO rio vermelho')).toBe(
      'Ingleses do Rio Vermelho',
    );
    expect(formatNeighborhoodName('barra das DOS e')).toBe('Barra das dos e');
  });

  it('capitalizes an article or preposition that comes first', () => {
    expect(formatNeighborhoodName('da lagoa')).toBe('Da Lagoa');
  });

  it('only lowercases whole words', () => {
    expect(formatNeighborhoodName('DESTERRO EDEN')).toBe('Desterro Eden');
  });

  it('collapses repeated spaces', () => {
    expect(formatNeighborhoodName('  lagoa   da  conceição ')).toBe(
      'Lagoa da Conceição',
    );
  });

  it('splits words only on spaces', () => {
    expect(formatNeighborhoodName('PÂNTANO-DO-SUL')).toBe('Pântano-do-sul');
  });
});
