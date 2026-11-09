import type { FastifyInstance } from 'fastify';
import { authenticate } from '../authenticate.js';
import type { CreateSuggestionController } from '../controllers/create-suggestion.controller.js';
import type { ListSuggestionsController } from '../controllers/list-suggestions.controller.js';
import type { RejectSuggestionController } from '../controllers/reject-suggestion.controller.js';

export const SUGGESTION_RATE_LIMIT = { max: 5, timeWindow: '1 hour' };

interface SuggestionsRoutesOptions {
  createSuggestionController: CreateSuggestionController;
  listSuggestionsController: ListSuggestionsController;
  rejectSuggestionController: RejectSuggestionController;
}

export async function suggestionsRoutes(
  app: FastifyInstance,
  {
    createSuggestionController,
    listSuggestionsController,
    rejectSuggestionController,
  }: SuggestionsRoutesOptions,
): Promise<void> {
  app.post(
    '/suggestions',
    { config: { rateLimit: SUGGESTION_RATE_LIMIT } },
    createSuggestionController.handle,
  );
  app.get(
    '/suggestions',
    { preHandler: authenticate },
    listSuggestionsController.handle,
  );
  app.post(
    '/suggestions/:id/reject',
    { preHandler: authenticate },
    rejectSuggestionController.handle,
  );
}
