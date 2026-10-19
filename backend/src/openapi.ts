import type { StaticDocumentSpec } from '@fastify/swagger';
import { z } from 'zod';
import { paramsSchema as deleteRestaurantParams } from './controllers/delete-restaurant.controller.js';
import { paramsSchema as getRestaurantParams } from './controllers/get-restaurant.controller.js';
import { querySchema as listRestaurantsQuery } from './controllers/list-restaurants.controller.js';
import { bodySchema as loginBody } from './controllers/login.controller.js';
import { restaurantBodySchema } from './controllers/restaurant-body.js';
import { paramsSchema as updateRestaurantParams } from './controllers/update-restaurant.controller.js';
import { SESSION_COOKIE_NAME } from './controllers/session-cookie.js';

type OpenApiDocument = Extract<
  StaticDocumentSpec['document'],
  { openapi: string }
>;
type Operation = NonNullable<
  NonNullable<OpenApiDocument['paths'][string]>['get']
>;
type Parameter = NonNullable<Operation['parameters']>[number];
type SchemaObject = Exclude<
  NonNullable<Extract<Parameter, { in: string }>['schema']>,
  { $ref: string }
>;
type Responses = Operation['responses'];

// The documentation describes what the client sends, so transforms are
// documented by their input type.
function toSchema(schema: z.ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as SchemaObject;
}

// Turns each property of a Zod object into a query or path parameter.
function toParameters(
  schema: z.ZodType,
  location: 'query' | 'path',
): Parameter[] {
  const { properties = {}, required = [] } = toSchema(schema);

  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: location,
    required: location === 'path' || required.includes(name),
    schema: property,
  }));
}

function jsonBody(schema: z.ZodType): Operation['requestBody'] {
  return {
    required: true,
    content: { 'application/json': { schema: toSchema(schema) } },
  };
}

const errorResponses = {
  400: { description: 'Dados inválidos (VALIDATION_ERROR)' },
  401: { description: 'Não autenticado (UNAUTHENTICATED)' },
  404: { description: 'Restaurante não encontrado (RESTAURANT_NOT_FOUND)' },
} satisfies Responses;

const adminOnly = [{ sessionCookie: [] }];

export const openApiDocument: OpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Veganos API',
    version: '1.0.0',
    description:
      'API do mapa de restaurantes veganos de Florianópolis. As rotas de escrita exigem um admin logado: faça `POST /auth/login` e o cookie de sessão passa a ser enviado nas próximas chamadas.',
  },
  tags: [
    { name: 'restaurants', description: 'Restaurantes' },
    { name: 'auth', description: 'Sessão do admin' },
    { name: 'health', description: 'Estado da API' },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: SESSION_COOKIE_NAME,
      },
    },
  },
  paths: {
    '/restaurants': {
      get: {
        tags: ['restaurants'],
        summary: 'Lista restaurantes, com filtros opcionais',
        description:
          'Os quatro parâmetros da área do mapa (`minLat`, `maxLat`, `minLng`, `maxLng`) são enviados juntos ou nenhum. A busca por nome (`q`) ignora maiúsculas e acentos.',
        parameters: toParameters(listRestaurantsQuery, 'query'),
        responses: {
          200: { description: 'Lista de restaurantes' },
          400: errorResponses[400],
        },
      },
      post: {
        tags: ['restaurants'],
        summary: 'Cria um restaurante',
        security: adminOnly,
        requestBody: jsonBody(restaurantBodySchema),
        responses: {
          201: { description: 'Restaurante criado' },
          400: errorResponses[400],
          401: errorResponses[401],
        },
      },
    },
    '/restaurants/{id}': {
      get: {
        tags: ['restaurants'],
        summary: 'Detalhe de um restaurante',
        parameters: toParameters(getRestaurantParams, 'path'),
        responses: {
          200: { description: 'Restaurante' },
          400: errorResponses[400],
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['restaurants'],
        summary: 'Substitui os dados de um restaurante',
        description: 'Campos opcionais ausentes são apagados.',
        security: adminOnly,
        parameters: toParameters(updateRestaurantParams, 'path'),
        requestBody: jsonBody(restaurantBodySchema),
        responses: {
          200: { description: 'Restaurante atualizado' },
          ...errorResponses,
        },
      },
      delete: {
        tags: ['restaurants'],
        summary: 'Remove um restaurante',
        security: adminOnly,
        parameters: toParameters(deleteRestaurantParams, 'path'),
        responses: {
          204: { description: 'Restaurante removido' },
          ...errorResponses,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Entra como admin e grava o cookie de sessão',
        requestBody: jsonBody(loginBody),
        responses: {
          200: { description: 'Admin logado; cookie de sessão gravado' },
          400: errorResponses[400],
          401: {
            description: 'E-mail ou senha inválidos (INVALID_CREDENTIALS)',
          },
          429: { description: 'Muitas tentativas (TOO_MANY_REQUESTS)' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['auth'],
        summary: 'Sai e apaga o cookie de sessão',
        responses: { 204: { description: 'Cookie de sessão apagado' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'Admin da sessão atual',
        security: adminOnly,
        responses: {
          200: { description: 'Admin logado' },
          401: errorResponses[401],
        },
      },
    },
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Informa se a API e o banco estão no ar',
        responses: {
          200: { description: 'API e banco no ar' },
          503: { description: 'Banco fora do ar' },
        },
      },
    },
  },
};
