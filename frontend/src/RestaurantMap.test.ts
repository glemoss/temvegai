// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { selectedPinY } from './RestaurantMap';

describe('selectedPinY', () => {
  it('puts the pin 10rem below the header', () => {
    expect(
      selectedPinY({ mapHeight: 900, headerBottom: 150, remSize: 16 }),
    ).toBe(310);
  });

  it('follows the size of the text', () => {
    expect(
      selectedPinY({ mapHeight: 1000, headerBottom: 150, remSize: 20 }),
    ).toBe(350);
  });

  it('keeps the pin above the details panel on short screens', () => {
    // The panel starts at 40% of 667px.
    expect(
      selectedPinY({ mapHeight: 667, headerBottom: 150, remSize: 16 }),
    ).toBeCloseTo(266.8 - 16);
  });
});
