import type { Knex } from 'knex';

const restaurants = [
  {
    name: 'Mandarina Culinária Vegana',
    type: 'fully_vegan',
    address: 'Calçadão João Pinto, 83',
    neighborhood: 'Centro',
    latitude: -27.598715,
    longitude: -48.549385,
    phone: '(48) 3879-3078',
    instagram: 'mandarinafloripa',
    opening_hours: 'Seg a sex, 10h30–14h30',
  },
  {
    name: 'Girassol Veg',
    type: 'fully_vegan',
    address: 'Rua Auroreal, 995',
    neighborhood: 'Campeche',
    latitude: -27.689461,
    longitude: -48.48593,
    phone: '(48) 99105-9986',
    instagram: 'girassolveg20',
    opening_hours: 'Seg a sáb, 11h30–22h; dom, 11h30–18h',
  },
  {
    name: 'Kairú',
    type: 'fully_vegan',
    address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
    neighborhood: 'Rio Tavares',
    latitude: -27.661458,
    longitude: -48.499222,
    phone: '(48) 99124-2935',
    instagram: 'kairu.veg',
    opening_hours: 'Seg e qua a dom, 19h–23h; fecha ter',
  },
  {
    name: 'Desvio Veg',
    type: 'fully_vegan',
    address: 'Rua Victor Meirelles, 98',
    neighborhood: 'Centro',
    latitude: -27.598363,
    longitude: -48.548877,
    phone: '(48) 99134-1771',
    instagram: 'desvioveg',
    opening_hours: 'Seg a sáb, 11h–23h; dom, 14h–22h',
  },
  {
    name: 'Tsan The',
    type: 'fully_vegan',
    address: 'Rua Tenente Silveira, 111, sala 206',
    neighborhood: 'Centro',
    latitude: -27.596349,
    longitude: -48.550833,
    phone: '(48) 3223-2511',
    instagram: 'restaurantenaturaltsanthe',
    opening_hours: 'Seg a sex, 11h–14h',
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('restaurants').del();
  await knex('restaurants').insert(restaurants);
}
