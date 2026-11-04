import { describe, expect, it, vi } from 'vitest';
import { applyMapColors } from './mapColors';

function fakeMap(layerIds: string[]) {
  return {
    getStyle: () => ({ layers: layerIds.map((id) => ({ id })) }),
    setPaintProperty: vi.fn(),
  };
}

describe('applyMapColors', () => {
  it('colors every layer whose name matches', () => {
    const map = fakeMap(['road_minor_fill', 'bridge_pri_fill', 'water']);

    applyMapColors(map as never);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'road_minor_fill',
      'line-color',
      '#ffffff',
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'bridge_pri_fill',
      'line-color',
      '#ffffff',
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'water',
      'fill-color',
      '#94c1e1',
    );
  });

  it('leaves alone the layers that match no color', () => {
    const map = fakeMap(['boundary_country_inner']);

    applyMapColors(map as never);

    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });
});
