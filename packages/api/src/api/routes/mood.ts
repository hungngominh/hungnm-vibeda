import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { successResponse, failResponse } from '@vegabase/core';
import { executor } from '../../infrastructure/executor.js';
import { prisma } from '../../infrastructure/prisma.js';
import { createAiProvider } from '../plugins/ai-provider.js';
import { wsHub } from '../plugins/ws-hub.js';

const submitSchema = z.object({ rawText: z.string().min(1).max(500) });

const aiProvider = createAiProvider();

async function getTodayWords() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 86_400_000);
  const rows = await prisma.moodCluster.groupBy({
    by: ['phrase'],
    where: {
      isDeleted: false,
      entry: { isDeleted: false, logCreatedDate: { gte: start, lt: end } },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 50,
  });
  return rows.map(r => ({ phrase: r.phrase, count: r._count.id }));
}

export const moodRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/mood/submit', async (req, reply) => {
    const traceId = crypto.randomUUID();
    const body = submitSchema.parse(req.body);

    let clusters: string[] = [];
    try {
      clusters = await aiProvider.extractClusters(body.rawText);
    } catch (err) {
      req.log.error(err, 'AI extraction failed — saving entry without clusters');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exec = executor as any;
    const entryResult = await exec.addAsync(
      prisma.moodEntry,
      { rawText: body.rawText },
      'anonymous',
    ) as { isSuccess: boolean; error: { code: string }; data: { id: string } };

    if (!entryResult.isSuccess) {
      return reply.status(500).send(
        failResponse([{ code: 'DB_ERROR', message: 'Failed to save entry' }], traceId),
      );
    }

    const { id: entryId } = entryResult.data;

    if (clusters.length > 0) {
      await exec.addRangeAsync(
        prisma.moodCluster,
        clusters.map((phrase: string) => ({ entryId, phrase })),
        'anonymous',
      );
    }

    wsHub.broadcast({ type: 'cloud-update', data: await getTodayWords() });

    return reply.status(201).send(successResponse({ entryId, clusters }, traceId));
  });
};
