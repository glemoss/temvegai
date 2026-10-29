import { describe, expect, it } from 'vitest';
import {
  registeredSpelling,
  similarNeighborhoods,
} from './similarNeighborhoods';

const REGISTERED = [
  'Trindade',
  'Lagoa da Conceição',
  'Saco dos Limões',
  'Centro',
];

describe('registeredSpelling', () => {
  it('finds the name apart from case, accents and spaces around it', () => {
    expect(registeredSpelling(' lagoa da conceicao ', REGISTERED)).toBe(
      'Lagoa da Conceição',
    );
  });

  it('is null for a new name', () => {
    expect(registeredSpelling('Trindade Norte', REGISTERED)).toBeNull();
  });
});

describe('similarNeighborhoods', () => {
  it('finds the neighborhoods that share a word', () => {
    expect(similarNeighborhoods('Trindade Norte', REGISTERED)).toEqual([
      'Trindade',
    ]);
    expect(similarNeighborhoods('LAGOA', REGISTERED)).toEqual([
      'Lagoa da Conceição',
    ]);
    expect(similarNeighborhoods('Conceicao', REGISTERED)).toEqual([
      'Lagoa da Conceição',
    ]);
  });

  it('ignores the connecting words', () => {
    expect(similarNeighborhoods('Barra da Lagoa', REGISTERED)).toEqual([
      'Lagoa da Conceição',
    ]);
    expect(similarNeighborhoods('Ponta das Canas', REGISTERED)).toEqual([]);
  });

  it('is empty when no word is shared', () => {
    expect(similarNeighborhoods('Campeche', REGISTERED)).toEqual([]);
  });
});
