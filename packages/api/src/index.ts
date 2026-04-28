import { buildServer } from './api/server.js';
import { env } from './env.js';
import { prisma } from './infrastructure/prisma.js';

const app = await buildServer();
await app.listen({ port: env.PORT, host: '0.0.0.0' });

process.on('SIGTERM', async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});
