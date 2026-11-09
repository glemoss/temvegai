import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CreateSuggestionUseCase } from '../use-cases/create-suggestion.use-case.js';

export const bodySchema = z.strictObject({
  text: z.string().trim().min(1).max(300),
});

export class CreateSuggestionController {
  constructor(private readonly createSuggestion: CreateSuggestionUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { text } = bodySchema.parse(request.body);

    const suggestion = await this.createSuggestion.execute(text);

    return reply.status(201).send({ suggestion });
  };
}
