import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetCurrentAdminUseCase } from '../use-cases/get-current-admin.use-case.js';

export class GetCurrentAdminController {
  constructor(private readonly getCurrentAdmin: GetCurrentAdminUseCase) {}

  // Runs after the authenticate hook, which fills request.user.
  handle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const user = await this.getCurrentAdmin.execute(request.user.sub);

    return reply.status(200).send({ user });
  };
}
