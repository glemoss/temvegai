import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { UpdateRestaurantUseCase } from '../use-cases/update-restaurant.use-case.js';
import { restaurantBodySchema } from './restaurant-body.js';

const paramsSchema = z.object({
  id: z.uuid(),
});

export class UpdateRestaurantController {
  constructor(private readonly updateRestaurant: UpdateRestaurantUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);
    const data = restaurantBodySchema.parse(request.body);

    const restaurant = await this.updateRestaurant.execute(id, data);

    return reply.status(200).send({ restaurant });
  };
}
