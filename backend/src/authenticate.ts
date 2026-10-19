import type { FastifyRequest } from 'fastify';
import { UnauthenticatedError } from './use-cases/errors/unauthenticated.error.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

// preHandler for routes that require a logged-in admin. A missing, tampered or
// expired session cookie all end in the same UnauthenticatedError.
export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthenticatedError();
  }
}
