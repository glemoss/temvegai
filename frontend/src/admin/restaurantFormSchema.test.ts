import { describe, expect, it } from 'vitest';
import type { Restaurant } from '../api/restaurants';
import {
  draftToRestaurantFormValues,
  emptyRestaurantForm,
  emptyWeek,
  parseRestaurantForm,
  toFormErrors,
  toRestaurantFormValues,
  type RestaurantFormValues,
} from './restaurantFormSchema';

const valid: RestaurantFormValues = {
  ...emptyRestaurantForm,
  name: ' Mandarina ',
  type: 'fully_vegan',
  address: 'Rua das Flores, 100',
  neighborhood: 'Campeche',
  latitude: '-27.661458',
  longitude: '-48.499222',
};

function errorsOf(values: RestaurantFormValues) {
  const result = parseRestaurantForm(values);
  if (result.success) throw new Error('expected errors');
  return result.errors;
}

describe('parseRestaurantForm', () => {
  it('turns the form into the body of the API', () => {
    expect(parseRestaurantForm(valid)).toEqual({
      success: true,
      input: {
        name: 'Mandarina',
        description: null,
        type: 'fully_vegan',
        address: 'Rua das Flores, 100',
        neighborhood: 'Campeche',
        latitude: -27.661458,
        longitude: -48.499222,
        phone: null,
        website: null,
        instagram: null,
        openingHours: null,
      },
    });
  });

  it('keeps the optional fields and drops the @ of the Instagram', () => {
    const result = parseRestaurantForm({
      ...valid,
      description: 'Comida caseira',
      phone: '(48) 99999-0000',
      website: 'https://mandarina.com.br',
      instagram: '@mandarina.floripa',
    });

    expect(result).toMatchObject({
      success: true,
      input: {
        description: 'Comida caseira',
        phone: '48999990000',
        website: 'https://mandarina.com.br',
        instagram: 'mandarina.floripa',
      },
    });
  });

  it('accepts a landline and a mobile, with the area code', () => {
    expect(
      parseRestaurantForm({ ...valid, phone: '(48) 3333-4444' }),
    ).toMatchObject({ success: true, input: { phone: '4833334444' } });
    expect(errorsOf({ ...valid, phone: '(48) 3333-444' })).toEqual({
      phone: 'Informe DDD e número.',
    });
    expect(errorsOf({ ...valid, phone: '123' })).toEqual({
      phone: 'Informe DDD e número.',
    });
  });

  it('requires name, type, address, neighborhood and location', () => {
    expect(errorsOf(emptyRestaurantForm)).toEqual({
      name: 'Informe o nome.',
      type: 'Escolha o tipo.',
      address: 'Informe o endereço.',
      neighborhood: 'Informe o bairro.',
      latitude: 'Escolha a localização no mapa.',
      longitude: 'Escolha a localização no mapa.',
    });
  });

  it('rejects coordinates that are not numbers or out of range', () => {
    expect(errorsOf({ ...valid, latitude: 'abc', longitude: '200' })).toEqual({
      latitude: 'Use só números, como -27.59.',
      longitude: 'Use um valor entre -180 e 180.',
    });
  });

  it('rejects a website without the protocol and an invalid Instagram', () => {
    expect(
      errorsOf({ ...valid, website: 'mandarina.com.br', instagram: 'a b' }),
    ).toEqual({
      website: 'Site inválido.',
      instagram: 'Usuário inválido.',
    });
  });

  it('accepts a description of up to 300 characters, trimmed', () => {
    const description = ` ${'a'.repeat(300)} `;
    expect(parseRestaurantForm({ ...valid, description })).toMatchObject({
      success: true,
      input: { description: 'a'.repeat(300) },
    });
    expect(errorsOf({ ...valid, description: 'a'.repeat(301) })).toEqual({
      description: 'Use no máximo 300 caracteres.',
    });
  });

  it('sends no hours when every day is empty', () => {
    expect(parseRestaurantForm(valid)).toMatchObject({
      success: true,
      input: { openingHours: null },
    });
  });

  it('checks the times of the intervals', () => {
    expect(
      errorsOf({
        ...valid,
        openingHours: { ...emptyWeek, monday: [{ opens: '', closes: '' }] },
      }),
    ).toEqual({
      'openingHours.monday.0.opens': 'Informe a abertura.',
      'openingHours.monday.0.closes': 'Informe o fechamento.',
    });
  });

  it('accepts several intervals, the last one past midnight', () => {
    const openingHours = {
      ...emptyWeek,
      friday: [
        { opens: '11:00', closes: '15:00' },
        { opens: '18:00', closes: '02:00' },
      ],
    };

    expect(parseRestaurantForm({ ...valid, openingHours })).toMatchObject({
      success: true,
      input: { openingHours },
    });
  });

  it('rejects overlapping intervals and one past midnight before another', () => {
    expect(
      errorsOf({
        ...valid,
        openingHours: {
          ...emptyWeek,
          monday: [
            { opens: '11:00', closes: '15:00' },
            { opens: '14:00', closes: '18:00' },
          ],
          tuesday: [
            { opens: '22:00', closes: '01:00' },
            { opens: '23:00', closes: '23:30' },
          ],
          wednesday: [{ opens: '10:00', closes: '10:00' }],
        },
      }),
    ).toEqual({
      'openingHours.monday.1': 'Intervalos fora de ordem ou sobrepostos.',
      'openingHours.tuesday.0': 'Só o último intervalo passa da meia-noite.',
      'openingHours.wednesday.0': 'Abertura igual ao fechamento.',
    });
  });
});

describe('toFormErrors', () => {
  it('keeps the first message of each field', () => {
    expect(
      toFormErrors([
        { field: 'name', message: 'first' },
        { field: 'name', message: 'second' },
        { field: '', message: 'unknown' },
      ]),
    ).toEqual({ name: 'first', '': 'unknown' });
  });
});

describe('toRestaurantFormValues', () => {
  const restaurant: Restaurant = {
    id: '6a2e5bcb-a4ae-4450-b16d-38e999a29c59',
    name: 'Mandarina',
    description: 'Cozinha vegana.',
    type: 'vegan_options',
    address: 'Rua das Flores, 100',
    neighborhood: 'Campeche',
    latitude: -27.661458,
    longitude: -48.499222,
    phone: '48999990000',
    website: 'https://mandarina.com.br',
    instagram: 'mandarinafloripa',
    openingHours: {
      ...emptyWeek,
      friday: [{ opens: '18:00', closes: '02:00' }],
    },
  };

  it('fills the form with the restaurant', () => {
    expect(toRestaurantFormValues(restaurant)).toEqual({
      name: 'Mandarina',
      description: 'Cozinha vegana.',
      type: 'vegan_options',
      address: 'Rua das Flores, 100',
      neighborhood: 'Campeche',
      latitude: '-27.661458',
      longitude: '-48.499222',
      phone: '(48) 99999-0000',
      website: 'https://mandarina.com.br',
      instagram: 'mandarinafloripa',
      openingHours: restaurant.openingHours,
    });
  });

  it('shows a phone kept out of the 10 or 11 digits with the mask', () => {
    expect(
      toRestaurantFormValues({ ...restaurant, phone: '3333-44' }),
    ).toMatchObject({ phone: '(33) 3344' });
  });

  it('leaves empty the fields the restaurant does not have', () => {
    const values = toRestaurantFormValues({
      ...restaurant,
      description: null,
      phone: null,
      website: null,
      instagram: null,
      openingHours: null,
    });

    expect(values).toMatchObject({
      description: '',
      phone: '',
      website: '',
      instagram: '',
      openingHours: emptyWeek,
    });
  });

  it('gives back the restaurant when sent unchanged', () => {
    // toEqual takes an undefined property as missing, so the id is left out.
    expect(parseRestaurantForm(toRestaurantFormValues(restaurant))).toEqual({
      success: true,
      input: { ...restaurant, id: undefined },
    });
  });
});

describe('draftToRestaurantFormValues', () => {
  it('fills the form with the draft, leaving the location empty', () => {
    const openingHours = {
      ...emptyWeek,
      friday: [{ opens: '18:00', closes: '23:00' }],
    };

    expect(
      draftToRestaurantFormValues({
        name: 'Kairú',
        description: 'Cozinha vegana.',
        type: 'fully_vegan',
        address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
        neighborhood: 'Rio Tavares',
        phone: '48991242935',
        website: 'https://kairu.com.br',
        instagram: 'kairu.veg',
        openingHours,
      }),
    ).toEqual({
      name: 'Kairú',
      description: 'Cozinha vegana.',
      type: 'fully_vegan',
      address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
      neighborhood: 'Rio Tavares',
      latitude: '',
      longitude: '',
      phone: '(48) 99124-2935',
      website: 'https://kairu.com.br',
      instagram: 'kairu.veg',
      openingHours,
    });
  });

  it('leaves empty what the AI did not find', () => {
    expect(
      draftToRestaurantFormValues({
        name: 'Kairú',
        description: null,
        type: null,
        address: null,
        neighborhood: null,
        phone: null,
        website: null,
        instagram: null,
        openingHours: null,
      }),
    ).toEqual({ ...emptyRestaurantForm, name: 'Kairú' });
  });
});
