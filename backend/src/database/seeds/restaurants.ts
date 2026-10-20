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
    opening_hours: 'Segunda a sexta: 10h30–14h30; Sábado e domingo: fechado',
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
    opening_hours: 'Segunda a sábado: 11h30–22h; Domingo: 11h30–18h',
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
    opening_hours:
      'Segunda: 19h–23h; Terça: fechado; Quarta a domingo: 19h–23h',
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
    opening_hours: 'Segunda a sábado: 11h–23h; Domingo: 14h–22h',
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
    opening_hours: 'Segunda a sexta: 11h–14h; Sábado e domingo: fechado',
  },
  {
    name: 'Bugio Centro',
    type: 'vegan_options',
    address: 'Rua Victor Meirelles, 112',
    neighborhood: 'Centro',
    latitude: -27.598471,
    longitude: -48.548734,
    phone: '(48) 99618-4851',
    instagram: 'bugiocentro',
    opening_hours:
      'Segunda a quarta: 18h–2h; Quinta e sexta: 18h–4h; Sábado: 12h–4h; Domingo: 11h30–2h',
  },
  {
    name: 'Bugio Trindade',
    type: 'vegan_options',
    address: 'Servidão Cristiano Wanderley Faria, 25',
    neighborhood: 'Trindade',
    latitude: -27.596398,
    longitude: -48.522447,
    instagram: 'bugiotrindade',
    opening_hours:
      'Segunda a sexta: 17h–23h55; Sábado: 18h–23h55; Domingo: fechado',
  },
  {
    name: 'Janela Bar',
    type: 'vegan_options',
    address: 'Rua Nunes Machado, 93',
    neighborhood: 'Centro',
    latitude: -27.598632,
    longitude: -48.549069,
    phone: '(48) 99144-6859',
    instagram: 'janelabar.floripacentro',
    opening_hours:
      'Segunda: fechado; Terça: 17h–23h; Quarta e quinta: 17h–0h; Sexta e sábado: 17h–2h; Domingo: 17h–0h',
  },
  {
    name: 'Dona Jovem',
    type: 'vegan_options',
    address: 'Avenida Hercílio Luz, 636',
    neighborhood: 'Centro',
    latitude: -27.597772,
    longitude: -48.547638,
    instagram: 'dona.jovem',
    opening_hours:
      'Segunda e terça: fechado; Quarta e quinta: 17h30–0h; Sexta e sábado: 17h30–1h; Domingo: fechado',
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('restaurants').del();
  await knex('restaurants').insert(restaurants);
}
