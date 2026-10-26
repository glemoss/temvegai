import { describe, expect, it } from 'vitest';
import { displayWebsite } from './displayWebsite';

describe('displayWebsite', () => {
  it('removes the protocol, www and the trailing slash', () => {
    expect(displayWebsite('https://www.mandarina.com.br/')).toBe(
      'mandarina.com.br',
    );
  });

  it('removes http as well as https', () => {
    expect(displayWebsite('http://mandarina.com.br')).toBe('mandarina.com.br');
  });

  it('ignores the case of the protocol and of www', () => {
    expect(displayWebsite('HTTPS://WWW.Mandarina.com.br')).toBe(
      'Mandarina.com.br',
    );
  });

  it('keeps the path without the trailing slash', () => {
    expect(displayWebsite('http://bugio.com.br/cardapio/')).toBe(
      'bugio.com.br/cardapio',
    );
  });

  it('keeps the query', () => {
    expect(displayWebsite('https://bugio.com.br/?unidade=centro')).toBe(
      'bugio.com.br/?unidade=centro',
    );
  });

  it('keeps subdomains other than www', () => {
    expect(displayWebsite('https://loja.mandarina.com.br/')).toBe(
      'loja.mandarina.com.br',
    );
  });
});
