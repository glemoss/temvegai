// What the restaurant form holds and how it becomes the body of
// POST /restaurants. The rules mirror the API, so most mistakes are shown
// before sending; the API still has the last word.
import { z } from 'zod';
import type {
  RestaurantInput,
  RestaurantType,
  TimeInterval,
  WeeklyHours,
} from '../api/restaurants';

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
  description: optionalText(),
  type: z.enum(['fully_vegan', 'vegan_options'], { error: 'Escolha o tipo.' }),
  address: requiredText('Informe o endereço.'),
  neighborhood: requiredText('Informe o bairro.'),
  latitude: coordinate(90),
  longitude: coordinate(180),
  phone: optionalText(),
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
