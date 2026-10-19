import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { DeleteRestaurantUseCase } from '../use-cases/delete-restaurant.use-case.js';

export const paramsSchema = z.object({
  id: z.uuid(),
});

export class DeleteRestaurantController {
  constructor(private readonly deleteRestaurant: DeleteRestaurantUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);

    await this.deleteRestaurant.execute(id);

    return reply.status(204).send();
  };
}
