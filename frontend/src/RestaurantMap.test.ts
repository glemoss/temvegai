// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { visibleArea } from './RestaurantMap';

describe('visibleArea', () => {
  it('leaves the space between the header and the panel on narrow screens', () => {
    // The panel starts at 40% of 900px.
    expect(
      visibleArea({
        mapWidth: 390,
        mapHeight: 900,
        headerBottom: 150,
        remSize: 16,
        narrow: true,
      }),
    ).toEqual({ left: 0, top: 150, right: 390, bottom: 360 });
  });

  it('leaves the space left of the panel and below the header on wide screens', () => {
    // The panel is 24rem wide.
    expect(
      visibleArea({
        mapWidth: 1280,
        mapHeight: 800,
        headerBottom: 140,
        remSize: 16,
        narrow: false,
      }),
    ).toEqual({ left: 0, top: 140, right: 896, bottom: 800 });
  });

  it('follows the size of the text', () => {
    expect(
      visibleArea({
        mapWidth: 1280,
        mapHeight: 800,
        headerBottom: 140,
        remSize: 20,
        narrow: false,
      }).right,
    ).toBe(800);
  });

  it.each([true, false])(
    'leaves all the space below the header when the panel is closed (narrow: %s)',
    (narrow) => {
      expect(
        visibleArea({
          mapWidth: 1280,
          mapHeight: 800,
          headerBottom: 140,
          remSize: 16,
          narrow,
          detailsOpen: false,
        }),
      ).toEqual({ left: 0, top: 140, right: 1280, bottom: 800 });
    },
  );
});
