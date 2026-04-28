import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DbActionExecutor, PermissionCache } from '@vegabase/service';
import { MoodEntryService } from './mood-entry-service.js';

const prisma = new PrismaClient();
const executor = new DbActionExecutor();
const permissions = new PermissionCache(async () => [
  'MDY_ENTRY:VIEW', 'MDY_ENTRY:DELETE',
  'MDY_CLUSTER:VIEW', 'MDY_CLUSTER:DELETE',
]);
const service = new MoodEntryService(prisma, executor, permissions);

afterAll(() => prisma.$disconnect());

describe('MoodEntryService.delete', () => {
  it('cascade soft-deletes all clusters when entry is deleted', async () => {
    // Arrange
    const entryResult = await executor.addAsync(prisma.moodEntry, { rawText: 'cascade test' }, 'test');
    expect(entryResult.isSuccess).toBe(true);
    const entryId = entryResult.data.id;

    await executor.addAsync(prisma.moodCluster, { entryId, phrase: 'cluster A' }, 'test');
    await executor.addAsync(prisma.moodCluster, { entryId, phrase: 'cluster B' }, 'test');

    // Act
    const result = await service.delete({ id: entryId, callerUsername: 'admin', callerRoles: ['admin'] });

    // Assert
    expect(result.ok).toBe(true);
    const clusters = await prisma.moodCluster.findMany({ where: { entryId } });
    expect(clusters.every(c => c.isDeleted)).toBe(true);
  });
});

describe('MoodEntryService.getList', () => {
  it('filters entries by date', async () => {
    // Arrange: create entry with today's date (executor sets logCreatedDate)
    const today = new Date().toISOString().slice(0, 10);
    await executor.addAsync(prisma.moodEntry, { rawText: 'date filter test' }, 'test');

    // Act
    const result = await service.getList({ date: today, callerUsername: 'admin', callerRoles: ['admin'] });

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.total).toBeGreaterThanOrEqual(1);
  });
});
