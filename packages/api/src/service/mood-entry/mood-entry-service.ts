import { BaseService, type DbActionExecutor, type PermissionCache, type Logger } from '@vegabase/service';
import type { Errors } from '@vegabase/core';
import type { MoodEntry, PrismaClient } from '@prisma/client';
import { ScreenCodes } from '../../core/screen-codes.js';
import type { MoodEntryParam } from './mood-entry-param.js';

export class MoodEntryService extends BaseService<MoodEntry, MoodEntryParam> {
  protected readonly screenCode = ScreenCodes.MDY_ENTRY;
  protected readonly delegate;
  protected readonly allowedUpdateFields = [] as const;

  constructor(
    private readonly prisma: PrismaClient,
    executor: DbActionExecutor,
    permissions: PermissionCache,
    logger?: Logger,
  ) {
    super(executor, permissions, logger);
    this.delegate = prisma.moodEntry;
  }

  protected buildNewEntity(_p: MoodEntryParam) {
    return { rawText: '' };
  }

  protected applyFilter(where: Record<string, unknown>, p: MoodEntryParam) {
    const base = super.applyFilter(where, p);
    const cond: Record<string, unknown> = { ...base };
    if (p.date) {
      const d = new Date(p.date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86_400_000);
      cond.logCreatedDate = { gte: start, lt: end };
    } else if (p.dateFrom) {
      const d = new Date(p.dateFrom);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      cond.logCreatedDate = { gte: start };
    }
    if (p.keyword) {
      cond.rawText = { contains: p.keyword, mode: 'insensitive' };
    }
    return cond;
  }

  protected async checkDeleteCondition(param: MoodEntryParam, errors: Errors) {
    const clusters = await this.prisma.moodCluster.findMany({
      where: { entryId: param.id!, isDeleted: false },
      select: { id: true },
    });
    for (const { id } of clusters) {
      const result = await this.executor.softDeleteAsync(
        this.prisma.moodCluster,
        id,
        param.callerUsername,
      );
      if (!result.isSuccess) {
        errors.add('DB_ERROR', `Failed to cascade-delete cluster ${id}`);
        return;
      }
    }
  }

  protected async refineListData(items: MoodEntry[], _p: MoodEntryParam, _errors: Errors) {
    if (items.length === 0) return;
    const ids = items.map(e => e.id);
    const counts = await this.prisma.moodCluster.groupBy({
      by: ['entryId'],
      where: { entryId: { in: ids }, isDeleted: false },
      _count: { id: true },
    });
    const map = new Map(counts.map(c => [c.entryId, c._count.id]));
    for (const item of items) {
      (item as any)._clusterCount = map.get(item.id) ?? 0;
    }
  }
}
