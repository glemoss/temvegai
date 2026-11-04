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
  website: 'https://www.mandarina.com.br/',
  instagram: 'mandarinafloripa',
  openingHours: {
    monday: [{ opens: '10:30', closes: '14:30' }],
    tuesday: [{ opens: '10:30', closes: '14:30' }],
    wednesday: [{ opens: '10:30', closes: '14:30' }],
    thursday: [{ opens: '10:30', closes: '14:30' }],
    friday: [{ opens: '10:30', closes: '14:30' }],
    saturday: [],
    sunday: [],
  },
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
    expect(html).toContain(
      '<span>Segunda a sexta</span><span>10h30–14h30</span>',
    );
    expect(html).toContain('href="tel:(48) 3333-4444"');
    expect(html).toContain('href="https://www.mandarina.com.br/"');
    expect(html).toContain('>mandarina.com.br</a>');
    expect(html).toContain('href="https://www.instagram.com/mandarinafloripa"');
    expect(html).toContain(
      'aria-label="Acessar @mandarinafloripa no Instagram">Acessar</a>',
    );
  });

  it('links to the saved website when it uses http', () => {
    const html = render({ website: 'http://bugio.com.br/' });

    expect(html).toContain('href="http://bugio.com.br/"');
    expect(html).toContain('>bugio.com.br</a>');
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

  it('shows the phone and the Instagram side by side', () => {
    const html = render();

    expect(html).toMatch(
      /<div class="grid grid-cols-2[^"]*"><div><dt[^>]*>Telefone<\/dt>.*<\/div><div><dt[^>]*>Instagram<\/dt>/,
    );
  });

  it('opens external links in a new tab', () => {
    const html = render();

    expect(html.match(/target="_blank" rel="noreferrer"/g)).toHaveLength(3);
  });

  it('links to the directions to the restaurant on Google Maps', () => {
    const html = render();

    expect(html).toContain(
      'href="https://www.google.com/maps/dir/?api=1&amp;destination=-27.661458,-48.499222" target="_blank" rel="noreferrer"',
    );
    expect(html).toContain('Como chegar</a>');
  });

  it('uses the coordinates of the restaurant in the directions', () => {
    const html = render({ latitude: -27.5969, longitude: -48.5495 });

    expect(html).toContain('destination=-27.5969,-48.5495"');
  });
});
