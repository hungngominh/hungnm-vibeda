import { createBaseController } from '@vegabase/api';
import { z } from 'zod';
import { MoodEntryService } from '../../service/mood-entry/mood-entry-service.js';
import {
  moodEntryListSchema,
  moodEntryDeleteSchema,
} from '../../service/mood-entry/mood-entry-schemas.js';
import { prisma } from '../../infrastructure/prisma.js';
import { executor } from '../../infrastructure/executor.js';
import { permissionCache } from '../../infrastructure/permission-cache.js';

const moodEntryService = new MoodEntryService(prisma, executor, permissionCache);

const noOpSchema = z.object({}) as unknown as z.ZodType<any>;

export const entriesController = createBaseController({
  service: moodEntryService,
  prefix: '/api/admin/entries',
  schemas: {
    list: moodEntryListSchema,
    add: noOpSchema,
    update: noOpSchema,
    delete: moodEntryDeleteSchema,
  },
});
