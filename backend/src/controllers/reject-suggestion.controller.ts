import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { RejectSuggestionUseCase } from '../use-cases/reject-suggestion.use-case.js';

export const paramsSchema = z.object({
  id: z.uuid(),
});

export class RejectSuggestionController {
  constructor(private readonly rejectSuggestion: RejectSuggestionUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);

    const suggestion = await this.rejectSuggestion.execute(id);

    return reply.status(200).send({ suggestion });
  };
}
