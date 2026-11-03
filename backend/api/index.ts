import type { IncomingMessage, ServerResponse } from 'node:http';
import { composeApp } from '../src/compose-app.js';
import { serverEnvSchema, loadEnvOrExit } from '../src/config/env.js';

// Entry of the Vercel function. vercel.json sends every path here; the app is
// built once per instance and handles the requests without calling listen.
const env = loadEnvOrExit(serverEnvSchema);
const app = composeApp(env);

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit('request', request, response);
}
