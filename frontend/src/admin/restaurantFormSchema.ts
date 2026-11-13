// What the restaurant form holds, how a restaurant fills it and how it
// becomes the body of POST and PUT /restaurants. The rules mirror the API, so most mistakes are shown
// before sending; the API still has the last word.
import { z } from 'zod';
import type {
  Restaurant,
  RestaurantInput,
  RestaurantType,
  TimeInterval,
  WeeklyHours,
} from '../api/restaurants';
import type { RestaurantDraft } from '../api/suggestions';
import { maskPhone } from '../phone';

// The inputs hold text, as typed; an empty time is a field not filled yet.
export interface RestaurantFormValues {
  name: string;
  description: string;
  type: RestaurantType | '';
  address: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  instagram: string;
  // A week without any interval means the hours are not known.
  openingHours: WeeklyHours;
}

// Error messages by field, as dotted paths such as "name" or
// "openingHours.monday.0.opens", the same paths the API reports.
export type FormErrors = Record<string, string>;

// Counted after trimming, as the API counts it.
export const DESCRIPTION_MAX_LENGTH = 300;

export const emptyWeek: WeeklyHours = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

export const emptyRestaurantForm: RestaurantFormValues = {
  name: '',
  description: '',
  type: '',
  address: '',
  neighborhood: '',
  latitude: '',
  longitude: '',
  phone: '',
  website: '',
  instagram: '',
  openingHours: emptyWeek,
};

// A restaurant as saved, for editing; what the API has as null is an
// empty field, and hours not known are an empty week.
export function toRestaurantFormValues(
  restaurant: Restaurant,
): RestaurantFormValues {
  return {
    name: restaurant.name,
    description: restaurant.description ?? '',
    type: restaurant.type,
    address: restaurant.address,
    neighborhood: restaurant.neighborhood,
    latitude: String(restaurant.latitude),
    longitude: String(restaurant.longitude),
    phone: maskPhone(restaurant.phone ?? ''),
    website: restaurant.website ?? '',
    instagram: restaurant.instagram ?? '',
    openingHours: restaurant.openingHours ?? emptyWeek,
  };
}

// The AI draft of a suggestion, for the admin to review; what the AI did not
// find is an empty field, and the location is left for the admin to find
// from the address.
export function draftToRestaurantFormValues(
  draft: RestaurantDraft,
): RestaurantFormValues {
  return {
    name: draft.name,
    description: draft.description ?? '',
    type: draft.type ?? '',
    address: draft.address ?? '',
    neighborhood: draft.neighborhood ?? '',
    latitude: '',
    longitude: '',
    phone: maskPhone(draft.phone ?? ''),
    website: draft.website ?? '',
    instagram: draft.instagram ?? '',
    openingHours: draft.openingHours ?? emptyWeek,
  };
}

function requiredText(message: string) {
  return z.string().trim().min(1, message);
}

// Messages fit one line on a phone, since the form keeps a single line
// for each; the rules in full are in the hints of the fields.

// An empty field is sent as null.
function optionalText(format: z.ZodType<string, string> = z.string()) {
  return z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(format.nullable());
}

function coordinate(limit: number) {
  const outOfRange = `Use um valor entre -${limit} e ${limit}.`;
  return z
    .string()
    .trim()
    .min(1, 'Escolha a localização no mapa.')
    .transform(Number)
    .pipe(
      z
        .number({ error: 'Use só números, como -27.59.' })
        .min(-limit, outOfRange)
        .max(limit, outOfRange),
    );
}

const website = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
  error: 'Site inválido.',
});

// Sent without the @, as the API stores it.
const instagramUsername = z
  .string()
  .transform((value) => value.replace(/^@/, ''))
  .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, 'Usuário inválido.'));

// Sent as digits only, as the API stores it.
const phoneDigits = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10,11}$/, 'Informe DDD e número.'));

function time(message: string) {
  return z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, message);
}

const timeInterval = z
  .object({
    opens: time('Informe a abertura.'),
    closes: time('Informe o fechamento.'),
  })
  // Two empty times already have their own messages.
  .refine(({ opens, closes }) => !opens || opens !== closes, {
    message: 'Abertura igual ao fechamento.',
  });

// Times as "HH:MM" compare in order as text.
function dayHours(intervals: TimeInterval[], context: z.RefinementCtx) {
  intervals.forEach((interval, index) => {
    const previous = intervals[index - 1];
    if (previous && interval.opens < previous.closes) {
      context.addIssue({
        code: 'custom',
        message: 'Intervalos fora de ordem ou sobrepostos.',
        path: [index],
      });
    }
    if (interval.closes < interval.opens && index < intervals.length - 1) {
      context.addIssue({
        code: 'custom',
        message: 'Só o último intervalo passa da meia-noite.',
        path: [index],
      });
    }
  });
}

const day = z.array(timeInterval).superRefine(dayHours);

const weeklyHours = z.object({
  monday: day,
  tuesday: day,
  wednesday: day,
  thursday: day,
  friday: day,
  saturday: day,
  sunday: day,
});

const fieldsSchema = z.object({
  name: requiredText('Informe o nome.'),
  description: optionalText(
    z
      .string()
      .max(
        DESCRIPTION_MAX_LENGTH,
        `Use no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`,
      ),
  ),
  type: z.enum(['fully_vegan', 'vegan_options'], { error: 'Escolha o tipo.' }),
  address: requiredText('Informe o endereço.'),
  neighborhood: requiredText('Informe o bairro.'),
  latitude: coordinate(90),
  longitude: coordinate(180),
  phone: optionalText(phoneDigits),
  website: optionalText(website),
  instagram: optionalText(instagramUsername),
});

export type RestaurantFormResult =
  | { success: true; input: RestaurantInput }
  | { success: false; errors: FormErrors };

// A week without any interval is sent as null: the hours are not known.
export function parseRestaurantForm(
  values: RestaurantFormValues,
): RestaurantFormResult {
  const fields = fieldsSchema.safeParse(values);
  const hours = Object.values(values.openingHours).some(
    (intervals) => intervals.length > 0,
  )
    ? weeklyHours.safeParse(values.openingHours)
    : null;

  if (fields.success && (hours === null || hours.success)) {
    return {
      success: true,
      input: { ...fields.data, openingHours: hours ? hours.data : null },
    };
  }

  const issues = [
    ...(fields.error?.issues ?? []),
    ...(hours?.error?.issues ?? []).map((issue) => ({
      ...issue,
      path: ['openingHours', ...issue.path],
    })),
  ];
  return {
    success: false,
    errors: toFormErrors(
      issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    ),
  };
}

// The first message of each field.
export function toFormErrors(
  details: { field: string; message: string }[],
): FormErrors {
  const errors: FormErrors = {};
  for (const { field, message } of details) {
    errors[field] ??= message;
  }
  return errors;
}
