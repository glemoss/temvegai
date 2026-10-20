import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the project title', () => {
    const html = renderToString(<App />);

    expect(html).toContain('<h1>Tem Veg Aí?</h1>');
  });
});
