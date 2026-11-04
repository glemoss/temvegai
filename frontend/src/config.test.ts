import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const CARTO_KEY = 'carto-key';

describe('loadConfig', () => {
  it('reads the API address and the CARTO key', () => {
    expect(
      loadConfig({
        VITE_API_URL: 'http://localhost:3000',
        VITE_CARTO_KEY: CARTO_KEY,
      }),
    ).toEqual({ apiUrl: 'http://localhost:3000', cartoKey: CARTO_KEY });
  });

  it('removes the trailing slash', () => {
    expect(
      loadConfig({
        VITE_API_URL: 'http://localhost:3000/',
        VITE_CARTO_KEY: CARTO_KEY,
      }).apiUrl,
    ).toBe('http://localhost:3000');
  });

  it.each(['/api', '/api/'])('reads the path %s on the same domain', (path) => {
    expect(
      loadConfig({ VITE_API_URL: path, VITE_CARTO_KEY: CARTO_KEY }).apiUrl,
    ).toBe('/api');
  });

  it.each(['api', '//api.example.com'])('refuses the address %s', (value) => {
    expect(() =>
      loadConfig({ VITE_API_URL: value, VITE_CARTO_KEY: CARTO_KEY }),
    ).toThrow('VITE_API_URL');
  });

  it('refuses a missing address', () => {
    expect(() => loadConfig({ VITE_CARTO_KEY: CARTO_KEY })).toThrow(
      'VITE_API_URL',
    );
  });

  it('refuses an invalid address', () => {
    expect(() =>
      loadConfig({ VITE_API_URL: 'not a url', VITE_CARTO_KEY: CARTO_KEY }),
    ).toThrow('VITE_API_URL');
  });

  it('trims the CARTO key', () => {
    expect(
      loadConfig({
        VITE_API_URL: 'http://localhost:3000',
        VITE_CARTO_KEY: ` ${CARTO_KEY} `,
      }).cartoKey,
    ).toBe(CARTO_KEY);
  });

  it.each([undefined, '', '   '])('refuses the CARTO key %j', (value) => {
    expect(() =>
      loadConfig({
        VITE_API_URL: 'http://localhost:3000',
        VITE_CARTO_KEY: value,
      }),
    ).toThrow('VITE_CARTO_KEY');
  });
});
