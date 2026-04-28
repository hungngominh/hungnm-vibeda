import { z } from 'zod';

export const moodEntryListSchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  keyword: z.string().optional(),
}) as unknown as z.ZodType<any>;

export const moodEntryDeleteSchema = z.object({
  id: z.string().min(1),
}) as unknown as z.ZodType<any>;
