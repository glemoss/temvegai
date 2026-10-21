import type { Knex } from 'knex';
import type { Weekday, WeeklyHours } from '../../entities/restaurant.js';

const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// The days from first to last, Monday first: days('monday', 'friday').
function days(first: Weekday, last: Weekday = first): Weekday[] {
  return WEEKDAYS.slice(WEEKDAYS.indexOf(first), WEEKDAYS.indexOf(last) + 1);
}

// A weekly schedule as jsonb text, from [days, opens, closes] entries. Days
// left out are closed.
function week(...entries: [Weekday[], string, string][]): string {
  const hours = Object.fromEntries(
    WEEKDAYS.map((day) => [day, []]),
  ) as unknown as WeeklyHours;
  for (const [entryDays, opens, closes] of entries) {
    for (const day of entryDays) {
      hours[day].push({ opens, closes });
    }
  }
  return JSON.stringify(hours);
}

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
    opening_hours: week([days('monday', 'friday'), '10:30', '14:30']),
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
    opening_hours: week(
      [days('monday', 'saturday'), '11:30', '22:00'],
      [days('sunday'), '11:30', '18:00'],
    ),
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
    opening_hours: week(
      [days('monday'), '19:00', '23:00'],
      [days('wednesday', 'sunday'), '19:00', '23:00'],
    ),
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
    opening_hours: week(
      [days('monday', 'saturday'), '11:00', '23:00'],
      [days('sunday'), '14:00', '22:00'],
    ),
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
    opening_hours: week([days('monday', 'friday'), '11:00', '14:00']),
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
    opening_hours: week(
      [days('monday', 'wednesday'), '18:00', '02:00'],
      [days('thursday', 'friday'), '18:00', '04:00'],
      [days('saturday'), '12:00', '04:00'],
      [days('sunday'), '11:30', '02:00'],
    ),
  },
  {
    name: 'Bugio Trindade',
    type: 'vegan_options',
    address: 'Servidão Cristiano Wanderley Faria, 25',
    neighborhood: 'Trindade',
    latitude: -27.596398,
    longitude: -48.522447,
    instagram: 'bugiotrindade',
    opening_hours: week(
      [days('monday', 'friday'), '17:00', '23:55'],
      [days('saturday'), '18:00', '23:55'],
    ),
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
    opening_hours: week(
      [days('tuesday'), '17:00', '23:00'],
      [days('wednesday', 'thursday'), '17:00', '00:00'],
      [days('friday', 'saturday'), '17:00', '02:00'],
      [days('sunday'), '17:00', '00:00'],
    ),
  },
  {
    name: 'Dona Jovem',
    type: 'vegan_options',
    address: 'Avenida Hercílio Luz, 636',
    neighborhood: 'Centro',
    latitude: -27.597772,
    longitude: -48.547638,
    instagram: 'dona.jovem',
    opening_hours: week(
      [days('wednesday', 'thursday'), '17:30', '00:00'],
      [days('friday', 'saturday'), '17:30', '01:00'],
    ),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('restaurants').del();
  await knex('restaurants').insert(restaurants);
}
