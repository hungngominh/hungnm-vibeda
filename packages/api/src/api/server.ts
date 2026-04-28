import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebSocket from '@fastify/websocket';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandlerPlugin, vegabaseJwtPlugin, callerInfoPlugin } from '@vegabase/api';
import { env } from '../env.js';
import { moodRoutes } from './routes/mood.js';
import { cloudRoutes } from './routes/cloud.js';
import { adminRoutes } from './routes/admin.js';
import { entriesController } from './routes/entries.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function buildServer() {
  const app = Fastify({ logger: true });

  // WebSocket support — must register before routes that use it
  await app.register(fastifyWebSocket);

  // 1. Error handler (global)
  await app.register(errorHandlerPlugin);

  // 2. Public routes — registered BEFORE vegabaseJwtPlugin (LA-09)
  await app.register(moodRoutes);
  await app.register(cloudRoutes);
  await app.register(adminRoutes);

  // 3–5. JWT-protected scope — encapsulated child context (LA-09)
  // vegabaseJwtPlugin uses fastify-plugin (fp), which would escape encapsulation
  // if registered at root. Wrapping in a plain async plugin keeps the onRequest
  // hook scoped to this child and away from public routes above.
  await app.register(async (protected_) => {
    await protected_.register(vegabaseJwtPlugin, {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    await protected_.register(callerInfoPlugin);

    // Protected routes
    await protected_.register(entriesController);
  });

  // Static files: serve built React SPA in production
  const publicPath = join(__dirname, '../../public');
  try {
    await app.register(fastifyStatic, {
      root: publicPath,
      prefix: '/',
      decorateReply: false,
    });
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html');
    });
  } catch {
    // public/ folder absent in dev — skip static serving
  }

  return app;
}
