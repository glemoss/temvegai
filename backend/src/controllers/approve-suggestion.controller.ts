import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApproveSuggestionUseCase } from '../use-cases/approve-suggestion.use-case.js';
import { restaurantBodySchema } from './restaurant-body.js';

export const paramsSchema = z.object({
  id: z.uuid(),
});

export class ApproveSuggestionController {
  constructor(private readonly approveSuggestion: ApproveSuggestionUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);
    const data = restaurantBodySchema.parse(request.body);

    const { suggestion, restaurant } = await this.approveSuggestion.execute(
      id,
      data,
    );

    return reply.status(201).send({ suggestion, restaurant });
  };
}
