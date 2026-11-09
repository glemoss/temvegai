import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListSuggestionsUseCase } from '../use-cases/list-suggestions.use-case.js';

export class ListSuggestionsController {
  constructor(private readonly listSuggestions: ListSuggestionsUseCase) {}

  handle = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const suggestions = await this.listSuggestions.execute();

    return reply.status(200).send({ suggestions });
  };
}
