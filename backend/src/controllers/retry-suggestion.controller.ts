import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ProcessSuggestionUseCase } from '../use-cases/process-suggestion.use-case.js';
import type { RetrySuggestionUseCase } from '../use-cases/retry-suggestion.use-case.js';
import type { RunInBackground } from './run-in-background.js';

export const paramsSchema = z.object({
  id: z.uuid(),
});

export class RetrySuggestionController {
  constructor(
    private readonly retrySuggestion: RetrySuggestionUseCase,
    private readonly processSuggestion: ProcessSuggestionUseCase,
    private readonly runInBackground: RunInBackground,
  ) {}

  // 202: the suggestion is back in the queue, and the AI works after the
  // response.
  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const { id } = paramsSchema.parse(request.params);

    const suggestion = await this.retrySuggestion.execute(id);
    this.runInBackground(() => this.processSuggestion.execute(id));

    return reply.status(202).send({ suggestion });
  };
}
