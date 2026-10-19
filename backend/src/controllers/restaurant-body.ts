import { z } from 'zod';

const requiredText = z.string().trim().min(1);

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
    z.string().regex(/^[A-Za-z0-9._]{1,30}$/, 'Invalid Instagram username'),
  );

// Body of POST and PUT /restaurants. Unknown fields are rejected so a
// misspelled field fails instead of being treated as missing.
export const restaurantBodySchema = z.strictObject({
  name: requiredText,
  description: optionalText(),
  type: z.enum(['fully_vegan', 'vegan_options']),
  address: requiredText,
  neighborhood: requiredText,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: optionalText(),
  website: optionalText(website),
  instagram: optionalText(instagramUsername),
  openingHours: optionalText(),
});
