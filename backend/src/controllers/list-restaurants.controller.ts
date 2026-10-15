import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListRestaurantsUseCase } from '../use-cases/list-restaurants.use-case.js';

export class ListRestaurantsController {
  constructor(private readonly listRestaurants: ListRestaurantsUseCase) {}

  handle = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const restaurants = await this.listRestaurants.execute();

    return reply.status(200).send({ restaurants });
  };
}
