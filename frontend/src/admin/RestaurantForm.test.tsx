// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  geocodeAddress,
  reverseGeocode,
  type Coordinates,
} from '../api/geocoding';
import { ValidationError, type RestaurantInput } from '../api/restaurants';
import { useNeighborhoods } from '../useNeighborhoods';
import {
  GEOCODE_DELAY,
  RestaurantForm,
  REVERSE_GEOCODE_DELAY,
} from './RestaurantForm';
import {
  emptyRestaurantForm,
  type RestaurantFormValues,
} from './restaurantFormSchema';

vi.mock('../api/geocoding', () => ({
  geocodeAddress: vi.fn(),
  reverseGeocode: vi.fn(),
}));
vi.mock('../useNeighborhoods', () => ({ useNeighborhoods: vi.fn() }));
// Leaflet does not run in jsdom; a button stands in for a click on the map.
vi.mock('./LocationPicker', () => ({
  LocationPicker: ({
    onChange,
  }: {
    onChange: (location: Coordinates) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange({ latitude: -27.661458, longitude: -48.499222 })}
    >
      Marcar no mapa
    </button>
  ),
}));

const noArea = { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };

function renderForm({
  onSubmit = vi.fn<(input: RestaurantInput) => Promise<void>>(),
  onCancel = vi.fn<() => void>(),
  initialValues = emptyRestaurantForm,
}: {
  onSubmit?: (input: RestaurantInput) => Promise<void>;
  onCancel?: () => void;
  initialValues?: RestaurantFormValues;
} = {}) {
  render(
    <RestaurantForm
      initialValues={initialValues}
      submitLabel="Adicionar"
      submittingLabel="Adicionando…"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onSubmit, onCancel };
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function inputValue(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

function fillRequired() {
  type('Nome', 'Mandarina');
  fireEvent.click(screen.getByLabelText('100% vegano'));
  type('Endereço', 'Rua das Flores, 100');
  type('Bairro', 'Campeche');
  fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
}

// jsdom has no ResizeObserver, which the radio buttons use.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

beforeEach(() => {
  vi.mocked(geocodeAddress).mockReset();
  vi.mocked(reverseGeocode).mockReset().mockResolvedValue(null);
  vi.mocked(useNeighborhoods).mockReturnValue({
    status: 'success',
    neighborhoods: [
      { name: 'Campeche', bounds: noArea },
      { name: 'Centro', bounds: noArea },
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('RestaurantForm', () => {
  it('suggests the existing neighborhoods', () => {
    renderForm();

    const input = screen.getByLabelText('Bairro');
    const list = document.getElementById(input.getAttribute('list') ?? '');
    expect(
      [...(list?.querySelectorAll('option') ?? [])].map(
        (option) => option.value,
      ),
    ).toEqual(['Campeche', 'Centro']);
  });

  it('fills latitude and longitude from the map', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));

    expect(inputValue('Latitude')).toBe('-27.661458');
    expect(inputValue('Longitude')).toBe('-48.499222');
  });

  it('marks the required fields', () => {
    renderForm();

    const required = (label: string) =>
      screen.getByLabelText(label).getAttribute('aria-required');
    for (const label of [
      'Nome',
      'Endereço',
      'Bairro',
      'Latitude',
      'Longitude',
    ]) {
      expect(required(label)).toBe('true');
    }
    for (const label of ['Descrição', 'Telefone', 'Site', 'Instagram']) {
      expect(required(label)).toBe('false');
    }
    expect(
      screen
        .getByRole('radiogroup', { name: 'Tipo' })
        .getAttribute('aria-required'),
    ).toBe('true');
  });

  it('keeps a line for the error of every field', () => {
    renderForm();

    const name = screen.getByLabelText('Nome');
    const errorLine = document.getElementById(
      name.getAttribute('aria-describedby') ?? '',
    );
    expect(errorLine?.textContent).toBe('');

    submit();

    expect(errorLine?.textContent).toBe('Informe o nome.');
  });

  it('shows the errors on the fields without sending', () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByRole('alert').textContent).toBe(
      'Corrija os campos indicados.',
    );
    expect(screen.getByLabelText('Nome').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(screen.getByText('Escolha o tipo.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('limits the description and counts its characters', () => {
    renderForm();
    expect(screen.getByLabelText('Descrição').getAttribute('maxlength')).toBe(
      '300',
    );
    const counter = () =>
      document.getElementById(
        screen
          .getByLabelText('Descrição')
          .getAttribute('aria-describedby')
          ?.split(' ')[0] ?? '',
      )?.textContent;

    expect(counter()).toBe('0/300');

    type('Descrição', ' Cozinha vegana. ');

    expect(counter()).toBe('17/300');
  });

  // A description saved before the limit may be longer; it must be
  // shortened before saving.
  it('does not send a saved description over the limit', () => {
    const { onSubmit } = renderForm({
      initialValues: { ...emptyRestaurantForm, description: 'a'.repeat(301) },
    });
    fillRequired();

    submit();

    expect(screen.getByText('301/300')).toBeTruthy();
    expect(screen.getByText('Use no máximo 300 caracteres.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('masks the phone as it is typed and sends only the digits', async () => {
    const { onSubmit } = renderForm();
    fillRequired();

    type('Telefone', '4833334444');
    expect(inputValue('Telefone')).toBe('(48) 3333-4444');
    type('Telefone', '(48) 3333-44448');
    expect(inputValue('Telefone')).toBe('(48) 33334-4448');

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '48333344448' }),
      ),
    );
  });

  it('does not send a phone without 10 or 11 digits', () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Telefone', '123');

    submit();

    expect(inputValue('Telefone')).toBe('(12) 3');
    expect(screen.getByText('Informe DDD e número.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends no opening hours when every day is empty', async () => {
    const { onSubmit } = renderForm();
    fillRequired();

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ openingHours: null }),
      ),
    );
  });

  it('sends the restaurant with its opening hours', async () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Instagram', '@mandarina');
    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar intervalo em sexta' }),
    );
    type('Sexta, intervalo 1: abre', '18:00');
    type('Sexta, intervalo 1: fecha', '02:00');

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Mandarina',
      description: null,
      type: 'fully_vegan',
      address: 'Rua das Flores, 100',
      neighborhood: 'Campeche',
      latitude: -27.661458,
      longitude: -48.499222,
      phone: null,
      website: null,
      instagram: 'mandarina',
      openingHours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [{ opens: '18:00', closes: '02:00' }],
        saturday: [],
        sunday: [],
      },
    });
  });

  it('shows the validation errors of the API on the fields', async () => {
    renderForm({
      onSubmit: vi
        .fn()
        .mockRejectedValue(
          new ValidationError([
            { field: 'neighborhood', message: 'Bairro recusado.' },
          ]),
        ),
    });
    fillRequired();

    submit();

    expect(await screen.findByText('Bairro recusado.')).toBeTruthy();
    expect(screen.getByLabelText('Bairro').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Adicionar',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it('shows an API error without a field next to the button', async () => {
    renderForm({
      onSubmit: vi
        .fn()
        .mockRejectedValue(
          new ValidationError([{ field: '', message: 'Campo desconhecido.' }]),
        ),
    });
    fillRequired();

    submit();

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Campo desconhecido.'),
    );
  });

  it('shows a message when saving fails', async () => {
    renderForm({ onSubmit: vi.fn().mockRejectedValue(new Error('offline')) });
    fillRequired();

    submit();

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Não foi possível salvar. Tente novamente mais tarde.',
      ),
    );
  });

  it('cancels', () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('RestaurantForm, new neighborhood', () => {
  function dialog() {
    return screen.queryByRole('alertdialog');
  }

  it('saves a registered neighborhood without asking, whatever its spelling', async () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Bairro', 'CENTRO');

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(dialog()).toBeNull();
  });

  it('asks before saving a new neighborhood, showing the similar ones', () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Bairro', 'Centro Histórico');

    submit();

    expect(dialog()?.textContent).toContain(
      'Nenhum restaurante está em “Centro Histórico”. Bairros parecidos: Centro. Salvar mesmo assim?',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks without similar ones when none shares a word', () => {
    renderForm();
    fillRequired();
    type('Bairro', 'Pantanal');

    submit();

    expect(dialog()?.textContent).toContain(
      'Nenhum restaurante está em “Pantanal”. Salvar mesmo assim?',
    );
  });

  it('goes back to the form without sending when cancelled', async () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Bairro', 'Pantanal');
    submit();

    fireEvent.click(
      within(dialog() as HTMLElement).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() => expect(dialog()).toBeNull());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(inputValue('Bairro')).toBe('Pantanal');
  });

  it('saves once confirmed', async () => {
    const { onSubmit } = renderForm();
    fillRequired();
    type('Bairro', 'Pantanal');
    submit();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar mesmo assim' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ neighborhood: 'Pantanal' }),
      ),
    );
    expect(dialog()).toBeNull();
  });

  it('asks when editing too', () => {
    const { onSubmit } = renderForm({
      initialValues: {
        ...emptyRestaurantForm,
        name: 'Mandarina',
        type: 'fully_vegan',
        address: 'Rua das Flores, 100',
        neighborhood: 'Campeche',
        latitude: '-27.66',
        longitude: '-48.49',
      },
    });
    type('Bairro', 'Campeche Sul');

    submit();

    expect(dialog()?.textContent).toContain(
      'Nenhum restaurante está em “Campeche Sul”. Bairros parecidos: Campeche.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves without asking while the registered ones are not known', async () => {
    vi.mocked(useNeighborhoods).mockReturnValue({ status: 'error' });
    const { onSubmit } = renderForm();
    fillRequired();
    type('Bairro', 'Pantanal');

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(dialog()).toBeNull();
  });
});

describe('RestaurantForm, location by address', () => {
  const found = { latitude: -27.59, longitude: -48.55, neighborhood: null };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  async function waitForSearch() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(GEOCODE_DELAY);
    });
  }

  it('searches the address once the typing stops and places the pin', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue(found);
    renderForm();

    type('Endereço', 'Rua das');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(GEOCODE_DELAY - 1);
    });
    type('Endereço', 'Rua das Flores, 100');
    type('Bairro', 'Campeche');
    await waitForSearch();

    expect(geocodeAddress).toHaveBeenCalledOnce();
    expect(geocodeAddress).toHaveBeenCalledWith(
      'Rua das Flores, 100',
      'Campeche',
      expect.any(AbortSignal),
    );
    expect(inputValue('Latitude')).toBe('-27.59');
    expect(inputValue('Longitude')).toBe('-48.55');
    expect(screen.getByRole('status').textContent).toBe(
      'Pin marcado pelo endereço. Confira e ajuste com um clique se precisar.',
    );
  });

  it('keeps a pin placed by hand until the address changes', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue(found);
    renderForm();

    type('Endereço', 'Rua das Flores, 100');
    fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
    await waitForSearch();

    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(inputValue('Latitude')).toBe('-27.661458');

    type('Endereço', 'Rua das Flores, 200');
    await waitForSearch();

    expect(inputValue('Latitude')).toBe('-27.59');
  });

  it('does not search when the form opens or the address is empty', async () => {
    renderForm({
      initialValues: { ...emptyRestaurantForm, address: 'Rua das Flores' },
    });
    await waitForSearch();

    type('Endereço', '');
    await waitForSearch();

    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('says when the address is not found', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue(null);
    renderForm();

    type('Endereço', 'Rua que não existe');
    await waitForSearch();

    expect(screen.getByRole('status').textContent).toBe(
      'Endereço não encontrado. Marque no mapa.',
    );
    expect(inputValue('Latitude')).toBe('');
  });

  it('says when the search fails', async () => {
    vi.mocked(geocodeAddress).mockRejectedValue(new Error('503'));
    renderForm();

    type('Endereço', 'Rua das Flores');
    await waitForSearch();

    expect(screen.getByRole('status').textContent).toBe(
      'Não foi possível buscar o endereço. Marque no mapa.',
    );
  });

  it('fills an empty neighborhood with the spelling already registered', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'CAMPECHE',
    });
    renderForm();

    type('Endereço', 'Avenida Pequeno Príncipe, 2000');
    await waitForSearch();

    expect(inputValue('Bairro')).toBe('Campeche');
    expect(screen.getByRole('status').textContent).toBe(
      'Pin e bairro preenchidos pelo endereço. Confira e ajuste se precisar.',
    );
  });

  it('leaves the neighborhood empty when the name found is not registered', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'Trindade Sul',
    });
    renderForm();

    type('Endereço', 'Rua Deputado Antônio Edu Vieira, 100');
    await waitForSearch();

    expect(inputValue('Bairro')).toBe('');
    expect(inputValue('Latitude')).toBe('-27.59');
    expect(screen.getByRole('status').textContent).toBe(
      'Pin marcado pelo endereço. “Trindade Sul” não é um bairro cadastrado; escolha o bairro.',
    );
  });

  it('leaves the neighborhood empty while the registered ones are not known', async () => {
    vi.mocked(useNeighborhoods).mockReturnValue({ status: 'error' });
    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'Campeche',
    });
    renderForm();

    type('Endereço', 'Avenida Pequeno Príncipe, 2000');
    await waitForSearch();

    expect(inputValue('Bairro')).toBe('');
  });

  it('keeps a neighborhood typed by the admin', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'Trindade Sul',
    });
    renderForm();

    type('Bairro', 'Trindade');
    type('Endereço', 'Rua Deputado Antônio Edu Vieira, 100');
    await waitForSearch();

    expect(inputValue('Bairro')).toBe('Trindade');
    expect(inputValue('Latitude')).toBe('-27.59');
    expect(geocodeAddress).toHaveBeenCalledWith(
      'Rua Deputado Antônio Edu Vieira, 100',
      'Trindade',
      expect.any(AbortSignal),
    );
  });

  it('replaces a neighborhood it filled, leaving it out of the next search', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'Centro',
    });
    renderForm();
    type('Endereço', 'Rua Felipe Schmidt, 100');
    await waitForSearch();
    expect(inputValue('Bairro')).toBe('Centro');

    vi.mocked(geocodeAddress).mockResolvedValue({
      ...found,
      neighborhood: 'Campeche',
    });
    type('Endereço', 'Avenida Pequeno Príncipe, 2000');
    await waitForSearch();

    expect(geocodeAddress).toHaveBeenLastCalledWith(
      'Avenida Pequeno Príncipe, 2000',
      '',
      expect.any(AbortSignal),
    );
    expect(inputValue('Bairro')).toBe('Campeche');
  });
});

describe('RestaurantForm, address by map', () => {
  const pantanal = {
    road: 'Rua Deputado Antônio Edu Vieira',
    houseNumber: '1740',
    neighborhood: 'Pantanal',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useNeighborhoods).mockReturnValue({
      status: 'success',
      neighborhoods: [
        { name: 'Campeche', bounds: noArea },
        { name: 'Centro', bounds: noArea },
        { name: 'Jurerê', bounds: noArea },
        { name: 'Pantanal', bounds: noArea },
      ],
    });
  });

  function clickMap() {
    fireEvent.click(screen.getByRole('button', { name: 'Marcar no mapa' }));
  }

  async function waitForReverseSearch() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVERSE_GEOCODE_DELAY);
    });
  }

  it('fills the address with street and number and the neighborhood', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    renderForm();

    clickMap();
    await waitForReverseSearch();

    expect(reverseGeocode).toHaveBeenCalledWith(
      { latitude: -27.661458, longitude: -48.499222 },
      expect.any(AbortSignal),
    );
    expect(inputValue('Endereço')).toBe(
      'Rua Deputado Antônio Edu Vieira, 1740',
    );
    expect(inputValue('Bairro')).toBe('Pantanal');
    expect(screen.getByRole('status').textContent).toBe(
      'Endereço e bairro preenchidos pelo mapa. Confira se precisar.',
    );
  });

  it('asks for the number when the map does not know it', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue({
      road: 'Rua dos Tucunarés',
      houseNumber: null,
      neighborhood: 'campeche',
    });
    renderForm();

    clickMap();
    await waitForReverseSearch();

    expect(inputValue('Endereço')).toBe('Rua dos Tucunarés');
    expect(inputValue('Bairro')).toBe('Campeche');
    expect(screen.getByRole('status').textContent).toBe(
      'Endereço e bairro preenchidos pelo mapa. Confira e complete o número.',
    );
  });

  it('searches only the last of several clicks', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    renderForm();

    clickMap();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REVERSE_GEOCODE_DELAY - 1);
    });
    clickMap();
    await waitForReverseSearch();

    expect(reverseGeocode).toHaveBeenCalledOnce();
  });

  it('keeps an address and a neighborhood typed by the admin', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    vi.mocked(geocodeAddress).mockResolvedValue(null);
    renderForm();

    type('Endereço', 'Rua das Flores, 100');
    type('Bairro', 'Centro');
    clickMap();
    await waitForReverseSearch();

    expect(inputValue('Endereço')).toBe('Rua das Flores, 100');
    expect(inputValue('Bairro')).toBe('Centro');
  });

  it('replaces an address it filled on the next click', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    renderForm();
    clickMap();
    await waitForReverseSearch();

    vi.mocked(reverseGeocode).mockResolvedValue({
      road: 'Rua dos Tucunarés',
      houseNumber: null,
      neighborhood: 'Jurerê',
    });
    clickMap();
    await waitForReverseSearch();

    expect(inputValue('Endereço')).toBe('Rua dos Tucunarés');
    expect(inputValue('Bairro')).toBe('Jurerê');
  });

  it('empties a neighborhood it filled when the next one is not registered', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    renderForm();
    clickMap();
    await waitForReverseSearch();

    vi.mocked(reverseGeocode).mockResolvedValue({
      road: 'Rua Lauro Linhares',
      houseNumber: '100',
      neighborhood: 'Trindade Norte',
    });
    clickMap();
    await waitForReverseSearch();

    expect(inputValue('Endereço')).toBe('Rua Lauro Linhares, 100');
    expect(inputValue('Bairro')).toBe('');
    expect(screen.getByRole('status').textContent).toBe(
      'Endereço preenchido pelo mapa. Confira se precisar. “Trindade Norte” não é um bairro cadastrado; escolha o bairro.',
    );
  });

  it('does not search the address it filled, keeping the pin', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(pantanal);
    renderForm();

    clickMap();
    await waitForReverseSearch();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(GEOCODE_DELAY);
    });

    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(inputValue('Latitude')).toBe('-27.661458');
  });

  it('does not search typed coordinates', async () => {
    renderForm();

    type('Latitude', '-27.6');
    type('Longitude', '-48.5');
    await waitForReverseSearch();

    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('says when the point has no address', async () => {
    renderForm();

    clickMap();
    await waitForReverseSearch();

    expect(screen.getByRole('status').textContent).toBe(
      'Nenhum endereço encontrado neste ponto.',
    );
  });
});
