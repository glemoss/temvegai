import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListNeighborhoodsUseCase } from '../use-cases/list-neighborhoods.use-case.js';

export class ListNeighborhoodsController {
  constructor(private readonly listNeighborhoods: ListNeighborhoodsUseCase) {}

  handle = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const neighborhoods = await this.listNeighborhoods.execute();

    return reply.status(200).send({ neighborhoods });
  };
}
