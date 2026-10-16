import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { RestaurantNotFoundError } from './use-cases/errors/restaurant-not-found.error.js';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

function errorBody(
  code: string,
  message: string,
  details?: ErrorBody['error']['details'],
): ErrorBody {
  return { error: { code, message, ...(details && { details }) } };
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (error instanceof ZodError) {
    return reply.status(400).send(
      errorBody(
        'VALIDATION_ERROR',
        'Dados inválidos.',
        error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      ),
    );
  }

  if (error instanceof RestaurantNotFoundError) {
    return reply
      .status(404)
      .send(errorBody('RESTAURANT_NOT_FOUND', 'Restaurante não encontrado.'));
  }

  // Errors raised by Fastify itself, such as a malformed JSON body.
  if (error.statusCode !== undefined && error.statusCode < 500) {
    return reply
      .status(error.statusCode)
      .send(errorBody('BAD_REQUEST', 'Requisição inválida.'));
  }

  request.log.error(error);
  return reply
    .status(500)
    .send(errorBody('INTERNAL_ERROR', 'Erro interno do servidor.'));
}

export function notFoundHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  return reply
    .status(404)
    .send(errorBody('ROUTE_NOT_FOUND', 'Rota não encontrada.'));
}
