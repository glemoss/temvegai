import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('reads the API address', () => {
    expect(loadConfig({ VITE_API_URL: 'http://localhost:3000' })).toEqual({
      apiUrl: 'http://localhost:3000',
    });
  });

  it('removes the trailing slash', () => {
    expect(loadConfig({ VITE_API_URL: 'http://localhost:3000/' })).toEqual({
      apiUrl: 'http://localhost:3000',
    });
  });

  it.each(['/api', '/api/'])('reads the path %s on the same domain', (path) => {
    expect(loadConfig({ VITE_API_URL: path })).toEqual({ apiUrl: '/api' });
  });

  it.each(['api', '//api.example.com'])('refuses the address %s', (value) => {
    expect(() => loadConfig({ VITE_API_URL: value })).toThrow('VITE_API_URL');
  });

  it('refuses a missing address', () => {
    expect(() => loadConfig({})).toThrow('VITE_API_URL');
  });

  it('refuses an invalid address', () => {
    expect(() => loadConfig({ VITE_API_URL: 'not a url' })).toThrow(
      'VITE_API_URL',
    );
  });
});
