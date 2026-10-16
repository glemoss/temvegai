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

function coordinate(limit: number) {
  return z
    .string()
    .trim()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(-limit).max(limit))
    .optional();
}

const querySchema = z
  .object({
    type: z.enum(['fully_vegan', 'vegan_options']).optional(),
    neighborhood: optionalText,
    q: optionalText,
    minLat: coordinate(90),
    maxLat: coordinate(90),
    minLng: coordinate(180),
    maxLng: coordinate(180),
  })
  .superRefine(({ minLat, maxLat, minLng, maxLng }, ctx) => {
    const sent = [minLat, maxLat, minLng, maxLng].filter(
      (value) => value !== undefined,
    ).length;

    if (sent > 0 && sent < 4) {
      ctx.addIssue({
        code: 'custom',
        path: ['bounds'],
        message: 'minLat, maxLat, minLng and maxLng must be sent together',
      });
    }
    if (minLat !== undefined && maxLat !== undefined && minLat > maxLat) {
      ctx.addIssue({
        code: 'custom',
        path: ['minLat'],
        message: 'minLat must not be greater than maxLat',
      });
    }
    if (minLng !== undefined && maxLng !== undefined && minLng > maxLng) {
      ctx.addIssue({
        code: 'custom',
        path: ['minLng'],
        message: 'minLng must not be greater than maxLng',
      });
    }
  });

export class ListRestaurantsController {
  constructor(private readonly listRestaurants: ListRestaurantsUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { type, neighborhood, q, minLat, maxLat, minLng, maxLng } =
      querySchema.parse(request.query);

    const filters: RestaurantFilters = { type, neighborhood, name: q };
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
