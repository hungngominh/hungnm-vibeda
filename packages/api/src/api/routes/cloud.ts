import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { successResponse } from '@vegabase/core';
import { prisma } from '../../infrastructure/prisma.js';
import { wsHub } from '../plugins/ws-hub.js';

const cloudQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function getWordsForDate(dateStr?: string) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start.getTime() + 86_400_000);
  const rows = await prisma.moodCluster.groupBy({
    by: ['phrase'],
    where: {
      isDeleted: false,
      entry: { isDeleted: false, logCreatedDate: { gte: start, lt: end } },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  return rows.map(r => ({ phrase: r.phrase, count: r._count.id }));
}

export const cloudRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/cloud', async (req, reply) => {
    const traceId = crypto.randomUUID();
    const { date } = cloudQuerySchema.parse(req.query);
    const words = await getWordsForDate(date);
    const dateLabel = date ?? new Date().toISOString().slice(0, 10);
    return reply.send(successResponse({ date: dateLabel, words }, traceId));
  });

  app.get('/api/cloud/ws', { websocket: true }, (socket, _req) => {
    wsHub.add(socket);
  });
};
