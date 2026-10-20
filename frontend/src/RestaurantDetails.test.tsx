import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Restaurant } from './api/restaurants';
import { RestaurantDetails } from './RestaurantDetails';

const restaurant: Restaurant = {
  id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
  name: 'Mandarina',
  description: 'Comida caseira vegana.',
  type: 'fully_vegan',
  address: 'Rua das Flores, 100',
  neighborhood: 'Centro',
  latitude: -27.661458,
  longitude: -48.499222,
  phone: '(48) 3333-4444',
  website: 'https://mandarina.com.br',
  instagram: 'mandarinafloripa',
  openingHours: 'Seg a sex, 10h30–14h30',
};

function render(overrides: Partial<Restaurant> = {}) {
  return renderToString(
    <RestaurantDetails
      restaurant={{ ...restaurant, ...overrides }}
      onClose={() => {}}
    />,
  );
}

describe('RestaurantDetails', () => {
  it('shows every field of the restaurant', () => {
    const html = render();

    expect(html).toContain('Mandarina</h2>');
    expect(html).toContain('100% vegano');
    expect(html).toContain('Comida caseira vegana.');
    expect(html).toContain('Rua das Flores, 100 — Centro');
    expect(html).toContain('Seg a sex, 10h30–14h30');
    expect(html).toContain('href="tel:(48) 3333-4444"');
    expect(html).toContain('href="https://mandarina.com.br"');
    expect(html).toContain('href="https://www.instagram.com/mandarinafloripa"');
    expect(html).toContain('@mandarinafloripa');
  });

  it('labels restaurants with vegan options', () => {
    const html = render({ type: 'vegan_options' });

    expect(html).toContain('Opções veganas');
    expect(html).not.toContain('100% vegano');
  });

  it('hides optional fields that are empty', () => {
    const html = render({
      description: null,
      phone: null,
      website: null,
      instagram: null,
      openingHours: null,
    });

    expect(html).toContain('Endereço');
    expect(html).not.toContain('Comida caseira');
    expect(html).not.toContain('Horário');
    expect(html).not.toContain('Telefone');
    expect(html).not.toContain('Site');
    expect(html).not.toContain('Instagram');
  });

  it('opens external links in a new tab', () => {
    const html = render();

    expect(html.match(/target="_blank" rel="noreferrer"/g)).toHaveLength(2);
  });
});
