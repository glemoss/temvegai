import { z } from 'zod';
import { restaurantBodySchema } from '../controllers/restaurant-body.js';
import type { RestaurantDraft } from '../entities/suggestion.js';

const fields = restaurantBodySchema.shape;

// Validates the draft with the rules of the restaurant form. A field that is
// missing or breaks a rule becomes null, for the admin to fill in the review;
// only a draft without the name is refused.
export const restaurantDraftSchema = z.object({
  name: fields.name,
  description: fields.description.catch(null),
  type: fields.type.nullable().catch(null),
  address: fields.address.nullable().catch(null),
  neighborhood: fields.neighborhood.nullable().catch(null),
  phone: fields.phone.catch(null),
  website: fields.website.catch(null),
  instagram: fields.instagram.catch(null),
  // A week with every day closed means the AI did not find the hours.
  openingHours: fields.openingHours
    .transform((hours) =>
      hours && Object.values(hours).every((day) => day.length === 0)
        ? null
        : hours,
    )
    .catch(null),
}) satisfies z.ZodType<RestaurantDraft, unknown>;
