import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { CreateSuggestionUseCase } from '../use-cases/create-suggestion.use-case.js';
import type { ProcessSuggestionUseCase } from '../use-cases/process-suggestion.use-case.js';
import type { RunInBackground } from './run-in-background.js';

export const bodySchema = z.strictObject({
  text: z.string().trim().min(1).max(300),
});

export class CreateSuggestionController {
  constructor(
    private readonly createSuggestion: CreateSuggestionUseCase,
    private readonly processSuggestion: ProcessSuggestionUseCase,
    private readonly runInBackground: RunInBackground,
  ) {}

  // The visitor gets the answer right away; the AI works after it.
  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { text } = bodySchema.parse(request.body);

    const suggestion = await this.createSuggestion.execute(text);
    this.runInBackground(() => this.processSuggestion.execute(suggestion.id));

    return reply.status(201).send({ suggestion });
  };
}
