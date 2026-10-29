import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { RestaurantFilters } from '../repositories/restaurant.repository.js';
import type { ListRestaurantsUseCase } from '../use-cases/list-restaurants.use-case.js';

// An empty value (`?q=`) is treated as if the parameter was not sent.
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

// Query values arrive as text. An empty one is refused instead of read as 0,
// and the documentation shows the parameter as the number it becomes.
function numberParam(schema: z.ZodNumber) {
  return z
    .string()
    .trim()
    .refine((value) => value !== '', 'Esperava um número')
    .transform(Number)
    .pipe(schema)
    .optional()
    .meta({
      type: schema.isInt ? 'integer' : 'number',
      minimum: schema.minValue ?? undefined,
      maximum: schema.maxValue ?? undefined,
    });
}

function coordinate(limit: number) {
  return numberParam(z.number().min(-limit).max(limit));
}

const MAX_LIMIT = 100;

export const querySchema = z
  .object({
    type: z.enum(['fully_vegan', 'vegan_options']).optional(),
    neighborhood: optionalText,
    q: optionalText,
    minLat: coordinate(90),
    maxLat: coordinate(90),
    minLng: coordinate(180),
    maxLng: coordinate(180),
    limit: numberParam(z.number().int().min(1).max(MAX_LIMIT)),
  })
  .superRefine(({ minLat, maxLat, minLng, maxLng }, ctx) => {
    const sent = [minLat, maxLat, minLng, maxLng].filter(
      (value) => value !== undefined,
    ).length;

    if (sent > 0 && sent < 4) {
      ctx.addIssue({
        code: 'custom',
        path: ['bounds'],
        message: 'minLat, maxLat, minLng e maxLng devem ser enviados juntos',
      });
    }
    if (minLat !== undefined && maxLat !== undefined && minLat > maxLat) {
      ctx.addIssue({
        code: 'custom',
        path: ['minLat'],
        message: 'minLat não pode ser maior que maxLat',
      });
    }
    if (minLng !== undefined && maxLng !== undefined && minLng > maxLng) {
      ctx.addIssue({
        code: 'custom',
        path: ['minLng'],
        message: 'minLng não pode ser maior que maxLng',
      });
    }
  });

export class ListRestaurantsController {
  constructor(private readonly listRestaurants: ListRestaurantsUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { type, neighborhood, q, minLat, maxLat, minLng, maxLng, limit } =
      querySchema.parse(request.query);

    const filters: RestaurantFilters = { type, neighborhood, name: q, limit };
    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLng !== undefined &&
      maxLng !== undefined
    ) {
      filters.bounds = { minLat, maxLat, minLng, maxLng };
    }

    const restaurants = await this.listRestaurants.execute(filters);

    return reply.status(200).send({ restaurants });
  };
}
