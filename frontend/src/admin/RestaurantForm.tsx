import {
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  geocodeAddress,
  reverseGeocode,
  type Coordinates,
  type GeocodedAddress,
  type PlaceDescription,
} from '../api/geocoding';
import {
  ValidationError,
  type RestaurantInput,
  type RestaurantType,
} from '../api/restaurants';
import { TYPE_LABELS } from '../restaurantTypeLabels';
import { useNeighborhoods } from '../useNeighborhoods';
import { LocationPicker } from './LocationPicker';
import { NewNeighborhoodDialog } from './NewNeighborhoodDialog';
import { OpeningHoursInput } from './OpeningHoursInput';
import {
  DESCRIPTION_MAX_LENGTH,
  parseRestaurantForm,
  toFormErrors,
  type FormErrors,
  type RestaurantFormValues,
} from './restaurantFormSchema';
import {
  registeredSpelling,
  similarNeighborhoods,
} from './similarNeighborhoods';

// How long the address must stay unchanged before it is searched; the
// geocoding service does not allow a search for every key typed.
export const GEOCODE_DELAY = 3000;

// How long after the last click on the map its address is searched, so a
// few clicks to adjust the pin make a single request.
export const REVERSE_GEOCODE_DELAY = 1000;

// Fields with a place of their own in the form; errors on any other path
// are shown next to the submit button.
const FIELDS = [
  'name',
  'description',
  'type',
  'address',
  'neighborhood',
  'latitude',
  'longitude',
  'phone',
  'website',
  'instagram',
];

const TYPES: RestaurantType[] = ['fully_vegan', 'vegan_options'];

// The asterisk of required fields; screen readers get aria-required
// instead of reading it.
const REQUIRED =
  "after:text-destructive after:content-['*'_/_''] after:font-normal";

// Every field keeps a line for its error, empty or not, so the form does
// not change size when errors appear.
const FIELD_ERROR =
  'min-h-[1.4em] text-sm leading-[1.4] font-semibold text-destructive';

const HINT = 'text-sm text-muted-foreground';

const FIELDSET = 'flex min-w-0 flex-col gap-1';

const LEGEND = 'p-0 text-sm font-medium';

function isShownByField(field: string): boolean {
  return FIELDS.includes(field) || /^openingHours\.[a-z]+(\.|$)/.test(field);
}

function toCoordinates({
  latitude,
  longitude,
}: RestaurantFormValues): Coordinates | null {
  const location = { latitude: Number(latitude), longitude: Number(longitude) };
  return latitude.trim() &&
    longitude.trim() &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
    ? location
    : null;
}

type TextField = Exclude<keyof RestaurantFormValues, 'type' | 'openingHours'>;

interface FieldProps {
  label: string;
  error: string | undefined;
  hint?: ReactNode;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string;
    'aria-required': boolean;
  }) => ReactNode;
}

// A label, its input, its hint and a line kept for its error, so the form
// does not change size when an error appears.
function Field({ label, error, hint, required = false, children }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, `${id}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id} className={required ? REQUIRED : undefined}>
        {label}
      </Label>
      {children({
        id,
        'aria-invalid': error !== undefined,
        'aria-describedby': describedBy,
        'aria-required': required,
      })}
      {hint && (
        <p id={`${id}-hint`} className={HINT}>
          {hint}
        </p>
      )}
      <p id={`${id}-error`} className={FIELD_ERROR}>
        {error}
      </p>
    </div>
  );
}

interface RestaurantFormProps {
  initialValues: RestaurantFormValues;
  submitLabel: string;
  submittingLabel: string;
  // May throw ValidationError, whose details are shown on the fields.
  onSubmit: (input: RestaurantInput) => Promise<void>;
  onCancel: () => void;
}

export function RestaurantForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: RestaurantFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The address to search, set only when the admin changes it, so opening
  // the form does not move a pin already placed.
  const [addressToFind, setAddressToFind] = useState<{
    address: string;
    neighborhood: string;
  } | null>(null);
  // The point to describe, set only by a click on the map.
  const [pinToDescribe, setPinToDescribe] = useState<Coordinates | null>(null);
  // What the searches did, shown below the map.
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  // Which fields a search filled rather than the admin typed; only those
  // may be replaced by the next search.
  const [filledBySearch, setFilledBySearch] = useState({
    address: false,
    neighborhood: false,
  });
  // A restaurant ready to be sent, waiting for the admin to confirm its
  // new neighborhood.
  const [toConfirm, setToConfirm] = useState<RestaurantInput | null>(null);
  const neighborhoods = useNeighborhoods();
  const neighborhoodListId = useId();
  const typeId = useId();

  // Null while the neighborhoods are not known, when no name can be told
  // new.
  const registered =
    neighborhoods.status === 'success'
      ? neighborhoods.neighborhoods.map(({ name }) => name)
      : null;

  function mayFill(key: 'address' | 'neighborhood'): boolean {
    return filledBySearch[key] || !values[key].trim();
  }

  // The neighborhood a search puts in the field: the registered spelling
  // of the name found or, when it is not registered, an empty field for
  // the admin to choose. Null leaves the field as it is.
  function searchedNeighborhood(found: string | null): string | null {
    if (!found || !mayFill('neighborhood')) return null;
    return registeredSpelling(found, registered ?? []) ?? '';
  }

  function unregisteredMessage(found: string | null): string {
    return `“${found}” não é um bairro cadastrado; escolha o bairro.`;
  }

  // Places the pin and fills the neighborhood unless the admin typed one.
  const applyGeocodedAddress = useEffectEvent((found: GeocodedAddress) => {
    const neighborhood = searchedNeighborhood(found.neighborhood);

    setValues((current) => ({
      ...current,
      latitude: String(found.latitude),
      longitude: String(found.longitude),
      ...(neighborhood !== null && { neighborhood }),
    }));
    if (neighborhood !== null) {
      setFilledBySearch((current) => ({
        ...current,
        neighborhood: neighborhood !== '',
      }));
    }
    setGeocodeMessage(
      neighborhood
        ? 'Pin e bairro preenchidos pelo endereço. Confira e ajuste se precisar.'
        : neighborhood === ''
          ? `Pin marcado pelo endereço. ${unregisteredMessage(found.neighborhood)}`
          : 'Pin marcado pelo endereço. Confira e ajuste com um clique se precisar.',
    );
  });

  // Fills the address and the neighborhood of the point clicked, unless
  // the admin typed them; the number is rare, so it may be left to the
  // admin.
  const applyPlaceDescription = useEffectEvent((place: PlaceDescription) => {
    const address =
      place.road && mayFill('address')
        ? [place.road, place.houseNumber].filter(Boolean).join(', ')
        : null;
    const neighborhood = searchedNeighborhood(place.neighborhood);

    setValues((current) => ({
      ...current,
      ...(address && { address }),
      ...(neighborhood !== null && { neighborhood }),
    }));
    setFilledBySearch((current) => ({
      address: current.address || address !== null,
      neighborhood:
        neighborhood === null ? current.neighborhood : neighborhood !== '',
    }));

    const filled =
      address && neighborhood
        ? 'Endereço e bairro preenchidos'
        : address
          ? 'Endereço preenchido'
          : neighborhood
            ? 'Bairro preenchido'
            : null;
    const messages = [
      filled &&
        `${filled} pelo mapa. ${
          address && !place.houseNumber
            ? 'Confira e complete o número.'
            : 'Confira se precisar.'
        }`,
      neighborhood === '' && unregisteredMessage(place.neighborhood),
    ].filter(Boolean);
    setGeocodeMessage(messages.length > 0 ? messages.join(' ') : null);
  });

  useEffect(() => {
    if (!addressToFind) return;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setGeocodeMessage('Procurando endereço…');
      geocodeAddress(
        addressToFind.address,
        addressToFind.neighborhood,
        controller.signal,
      ).then(
        (found) => {
          if (found) {
            applyGeocodedAddress(found);
          } else {
            setGeocodeMessage('Endereço não encontrado. Marque no mapa.');
          }
        },
        () => {
          if (!controller.signal.aborted) {
            setGeocodeMessage(
              'Não foi possível buscar o endereço. Marque no mapa.',
            );
          }
        },
      );
    }, GEOCODE_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressToFind]);

  useEffect(() => {
    if (!pinToDescribe) return;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setGeocodeMessage('Procurando o endereço do ponto…');
      reverseGeocode(pinToDescribe, controller.signal).then(
        (place) => {
          if (place) {
            applyPlaceDescription(place);
          } else {
            setGeocodeMessage('Nenhum endereço encontrado neste ponto.');
          }
        },
        () => {
          if (!controller.signal.aborted) {
            setGeocodeMessage(
              'Não foi possível buscar o endereço deste ponto.',
            );
          }
        },
      );
    }, REVERSE_GEOCODE_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pinToDescribe]);

  function set<Key extends keyof RestaurantFormValues>(
    key: Key,
    value: RestaurantFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function text(key: TextField) {
    return {
      name: key,
      value: values[key],
      onChange: (event: { target: { value: string } }) =>
        set(key, event.target.value),
    };
  }

  // The address moves the pin after the typing stops. A neighborhood a
  // search filled is left out of the next search, so an old one does not
  // pull a new address to the wrong place.
  function changeAddress(key: 'address' | 'neighborhood', value: string) {
    const next = { ...values, [key]: value };
    const typedNeighborhood =
      key === 'neighborhood' || !filledBySearch.neighborhood;
    setValues(next);
    setFilledBySearch((current) => ({ ...current, [key]: false }));
    setPinToDescribe(null);
    setGeocodeMessage(null);
    setAddressToFind(
      next.address.trim()
        ? {
            address: next.address,
            neighborhood: typedNeighborhood ? next.neighborhood : '',
          }
        : null,
    );
  }

  // A pin placed by hand wins over a search still waiting or running; the
  // address moves it again only when it changes. A click on the map also
  // fills the address of the point; typed coordinates do not, since they
  // would be searched halfway through.
  function placePin(
    location: Coordinates | null,
    latitude: string,
    longitude: string,
  ) {
    setValues((current) => ({ ...current, latitude, longitude }));
    setAddressToFind(null);
    setPinToDescribe(location);
    setGeocodeMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    const result = parseRestaurantForm(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    if (
      registered &&
      !registeredSpelling(result.input.neighborhood, registered)
    ) {
      setToConfirm(result.input);
      return;
    }
    await save(result.input);
  }

  async function save(input: RestaurantInput) {
    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (reason) {
      if (reason instanceof ValidationError) {
        setErrors(toFormErrors(reason.details));
      } else {
        setFailure('Não foi possível salvar. Tente novamente mais tarde.');
      }
      setSubmitting(false);
    }
  }

  const otherError = Object.entries(errors).find(
    ([field]) => !isShownByField(field),
  )?.[1];
  const formMessage =
    failure ??
    otherError ??
    (Object.keys(errors).length > 0 ? 'Corrija os campos indicados.' : null);
  // As typed, the length the field limits.
  const descriptionLength = values.description.length;

  return (
    <form
      className="flex flex-col gap-2 p-6 max-sm:p-4"
      noValidate
      onSubmit={submit}
    >
      <Field label="Nome" error={errors.name} required>
        {(props) => <Input type="text" {...props} {...text('name')} />}
      </Field>

      <div className="flex min-w-0 flex-col gap-1">
        <p
          id={`${typeId}-label`}
          className={cn('flex gap-2 text-sm font-medium', REQUIRED)}
        >
          Tipo
        </p>
        <RadioGroup
          name="type"
          required
          aria-labelledby={`${typeId}-label`}
          aria-invalid={errors.type !== undefined}
          aria-describedby={`${typeId}-error`}
          className="gap-0"
          value={values.type}
          onValueChange={(value) => {
            const type = TYPES.find((item) => item === value);
            if (type) set('type', type);
          }}
        >
          {TYPES.map((type) => (
            <div key={type} className="flex min-h-8 items-center gap-2">
              <RadioGroupItem id={`${typeId}-${type}`} value={type} />
              <Label htmlFor={`${typeId}-${type}`} className="font-normal">
                {TYPE_LABELS[type]}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p id={`${typeId}-error`} className={FIELD_ERROR}>
          {errors.type}
        </p>
      </div>

      <Field
        label="Descrição"
        error={errors.description}
        hint={
          <span
            className={
              descriptionLength > DESCRIPTION_MAX_LENGTH
                ? 'text-destructive'
                : undefined
            }
          >
            {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
          </span>
        }
      >
        {(props) => (
          <Textarea
            rows={3}
            maxLength={DESCRIPTION_MAX_LENGTH}
            {...props}
            {...text('description')}
          />
        )}
      </Field>

      <Field
        label="Endereço"
        error={errors.address}
        required
        hint="O pin é marcado no mapa quando você para de digitar."
      >
        {(props) => (
          <Input
            type="text"
            autoComplete="off"
            {...props}
            name="address"
            value={values.address}
            onChange={(event) => changeAddress('address', event.target.value)}
          />
        )}
      </Field>

      <Field label="Bairro" error={errors.neighborhood} required>
        {(props) => (
          <Input
            type="text"
            autoComplete="off"
            list={neighborhoodListId}
            {...props}
            name="neighborhood"
            value={values.neighborhood}
            onChange={(event) =>
              changeAddress('neighborhood', event.target.value)
            }
          />
        )}
      </Field>
      <datalist id={neighborhoodListId}>
        {neighborhoods.status === 'success' &&
          neighborhoods.neighborhoods.map(({ name }) => (
            <option key={name} value={name} />
          ))}
      </datalist>

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Localização</legend>
        <p className={HINT}>
          Clique no mapa para marcar o restaurante, ou digite as coordenadas.
        </p>
        <LocationPicker
          value={toCoordinates(values)}
          type={values.type || 'fully_vegan'}
          onChange={(location) =>
            placePin(
              location,
              String(location.latitude),
              String(location.longitude),
            )
          }
        />
        <p role="status" className={cn(HINT, 'min-h-[1.4em] leading-[1.4]')}>
          {geocodeMessage}
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          <Field label="Latitude" error={errors.latitude} required>
            {(props) => (
              <Input
                type="text"
                inputMode="decimal"
                {...props}
                name="latitude"
                value={values.latitude}
                onChange={(event) =>
                  placePin(null, event.target.value, values.longitude)
                }
              />
            )}
          </Field>
          <Field label="Longitude" error={errors.longitude} required>
            {(props) => (
              <Input
                type="text"
                inputMode="decimal"
                {...props}
                name="longitude"
                value={values.longitude}
                onChange={(event) =>
                  placePin(null, values.latitude, event.target.value)
                }
              />
            )}
          </Field>
        </div>
      </fieldset>

      <Field label="Telefone" error={errors.phone}>
        {(props) => <Input type="tel" {...props} {...text('phone')} />}
      </Field>

      <Field
        label="Site"
        error={errors.website}
        hint="Endereço completo, como https://exemplo.com.br."
      >
        {(props) => <Input type="url" {...props} {...text('website')} />}
      </Field>

      <Field
        label="Instagram"
        error={errors.instagram}
        hint="Só o nome de usuário, com ou sem @: letras, números, ponto e sublinhado."
      >
        {(props) => <Input type="text" {...props} {...text('instagram')} />}
      </Field>

      <fieldset className={FIELDSET}>
        <legend className={LEGEND}>Horário de funcionamento</legend>
        <p className={HINT}>
          Deixe todos os dias vazios se não souber o horário. Um horário que
          passa da meia-noite fica no dia em que abre, como 18:00 às 02:00.
        </p>
        <OpeningHoursInput
          value={values.openingHours}
          errors={errors}
          onChange={(openingHours) => set('openingHours', openingHours)}
        />
      </fieldset>

      <div className="mt-2 flex flex-wrap items-center gap-x-5">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0 text-base font-semibold underline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        {/* Always present, so screen readers announce the message. Beside
          the buttons or, on narrow screens, on a line of its own below
          them. */}
        <p
          role="alert"
          className="flex min-h-10 flex-[1_1_14rem] items-center font-semibold text-destructive"
        >
          {formMessage}
        </p>
      </div>

      {toConfirm && registered && (
        <NewNeighborhoodDialog
          name={toConfirm.neighborhood}
          similar={similarNeighborhoods(toConfirm.neighborhood, registered)}
          onCancel={() => setToConfirm(null)}
          onConfirm={() => {
            setToConfirm(null);
            void save(toConfirm);
          }}
        />
      )}
    </form>
  );
}
