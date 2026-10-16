import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { GetRestaurantUseCase } from '../use-cases/get-restaurant.use-case.js';

const paramsSchema = z.object({
  id: z.uuid(),
});

export class GetRestaurantController {
  constructor(private readonly getRestaurant: GetRestaurantUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);

    const restaurant = await this.getRestaurant.execute(id);

    return reply.status(200).send({ restaurant });
  };
}
