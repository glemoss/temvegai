import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateRestaurantUseCase } from '../use-cases/create-restaurant.use-case.js';
import { restaurantBodySchema } from './restaurant-body.js';

export class CreateRestaurantController {
  constructor(private readonly createRestaurant: CreateRestaurantUseCase) {}

  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const data = restaurantBodySchema.parse(request.body);

    const restaurant = await this.createRestaurant.execute(data);

    return reply.status(201).send({ restaurant });
  };
}
