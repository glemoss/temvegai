import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MapLegend } from './MapLegend';

describe('MapLegend', () => {
  it('shows the leaf of each type, without the pin', () => {
    const html = renderToString(<MapLegend />);

    expect(html).toContain('100% vegano');
    expect(html).toContain('Opções veganas');
    expect(html.match(/viewBox="0 0 24 24"/g)).toHaveLength(2);
    expect(html).not.toContain('viewBox="0 0 32 42"');
  });
});
