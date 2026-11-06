import { z } from 'zod';

const requiredText = z.string().trim().min(1, 'Campo obrigatório');

export const DESCRIPTION_MAX_LENGTH = 300;

// A missing field and an empty value are both stored as null, so a PUT
// without an optional field clears it.
function optionalText(format: z.ZodType<string, string> = z.string()) {
  return z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(format.nullable())
    .nullish()
    .transform((value) => value ?? null);
}

const website = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
});

// Stored without the @, so clients build the link as instagram.com/<username>.
const instagramUsername = z
  .string()
  .transform((value) => value.replace(/^@/, ''))
  .pipe(
    z.string().regex(/^[A-Za-z0-9._]{1,30}$/, 'Usuário do Instagram inválido'),
  );

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:MM');

const timeInterval = z
  .strictObject({ opens: time, closes: time })
  .refine(({ opens, closes }) => opens !== closes, {
    message: 'Abertura e fechamento devem ser diferentes',
  });

// Intervals of a day must be in order and must not overlap. Only the last
// one may end after midnight, since nothing can come after it that day.
const dayHours = z.array(timeInterval).superRefine((intervals, context) => {
  intervals.forEach((interval, index) => {
    const previous = intervals[index - 1];
    if (previous && interval.opens < previous.closes) {
      context.addIssue({
        code: 'custom',
        message: 'Intervalos devem estar em ordem e sem sobreposição',
        path: [index],
      });
    }
    if (interval.closes < interval.opens && index < intervals.length - 1) {
      context.addIssue({
        code: 'custom',
        message: 'Só o último intervalo do dia pode passar da meia-noite',
        path: [index],
      });
    }
  });
});

const weeklyHours = z.strictObject({
  monday: dayHours,
  tuesday: dayHours,
  wednesday: dayHours,
  thursday: dayHours,
  friday: dayHours,
  saturday: dayHours,
  sunday: dayHours,
});

// Body of POST and PUT /restaurants. Unknown fields are rejected so a
// misspelled field fails instead of being treated as missing.
export const restaurantBodySchema = z.strictObject({
  name: requiredText,
  description: optionalText(
    z
      .string()
      .max(
        DESCRIPTION_MAX_LENGTH,
        `Descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`,
      ),
  ),
  type: z.enum(['fully_vegan', 'vegan_options']),
  address: requiredText,
  neighborhood: requiredText,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: optionalText(),
  website: optionalText(website).meta({
    format: 'uri',
    description: 'Endereço completo, com `http://` ou `https://`.',
  }),
  instagram: optionalText(instagramUsername).meta({
    pattern: '^@?[A-Za-z0-9._]{1,30}$',
    description: 'Usuário do Instagram, com ou sem `@`; é salvo sem o `@`.',
  }),
  openingHours: weeklyHours.nullish().transform((value) => value ?? null),
});
