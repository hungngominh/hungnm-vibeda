# Moodaily Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Moodaily — an anonymous employee mood journaling web app with AI emotion clustering, real-time word cloud, and an admin dashboard.

**Architecture:** Fastify 5 backend (VegaBase consumer) at `packages/api/`; React+Vite SPA at `packages/web/`; pnpm workspace monorepo. Public routes registered before `vegabaseJwtPlugin`; protected admin CRUD routes after JWT (LA-09 rule). AI provider (OpenAI or Gemini) switchable via `AI_PROVIDER` env var without code changes.

**Tech Stack:** TypeScript · Fastify 5 · @vegabase/{core,service,api} 0.1.x · Prisma 6 · PostgreSQL · React 18 · Vite 6 · react-router-dom v6 · @fastify/websocket v11 · @fastify/static v8 · OpenAI SDK v4 · @google/generative-ai · argon2 · zod v3

---

## File Map

**Workspace root**
- `pnpm-workspace.yaml` — declares workspace packages
- `package.json` — root dev scripts only
- `.gitignore`

**packages/api/**
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `prisma/schema.prisma` — MoodEntry, MoodCluster, User models
- `prisma/seed.ts` — creates initial admin user via Argon2id
- `src/env.ts` — Zod env validation; exports typed `env` object; fail-fast on missing vars
- `src/core/screen-codes.ts` — ScreenCodes constants (NS-10)
- `src/infrastructure/prisma.ts` — PrismaClient singleton
- `src/infrastructure/executor.ts` — DbActionExecutor singleton
- `src/infrastructure/permission-cache.ts` — PermissionCache (full-access loader for single-admin app)
- `src/service/mood-entry/mood-entry-param.ts` — MoodEntryParam interface
- `src/service/mood-entry/mood-entry-schemas.ts` — Zod list/delete schemas
- `src/service/mood-entry/mood-entry-service.ts` — extends BaseService; cascade delete; date/keyword filter; cluster count enrichment
- `src/api/plugins/ai-provider.ts` — AiProvider interface + OpenAI/Gemini implementations + factory
- `src/api/plugins/ws-hub.ts` — in-memory WebSocket client Set with broadcast()
- `src/api/routes/mood.ts` — POST /api/mood/submit (public)
- `src/api/routes/cloud.ts` — GET /api/cloud + GET /api/cloud/ws (WebSocket, public)
- `src/api/routes/admin.ts` — POST /api/admin/login (public)
- `src/api/routes/entries.ts` — createBaseController for /api/admin/entries (protected)
- `src/api/server.ts` — Fastify app factory with LA-09 plugin ordering
- `src/index.ts` — entry point; listens on env.PORT

**packages/web/**
- `package.json`
- `tsconfig.json`
- `vite.config.ts` — proxy /api + /mascot → :3000; build outDir → ../api/public
- `index.html` — Plus Jakarta Sans font; model-viewer script tag
- `src/main.tsx` — applies saved mascot theme before first render
- `src/App.tsx` — React Router v6 routes
- `src/themes.css` — 4 `[data-theme=...]` CSS variable overrides + global reset
- `src/lib/api.ts` — typed fetch wrapper; reads JWT from localStorage
- `src/hooks/useCloudSocket.ts` — WebSocket → words state
- `src/components/Button.tsx`
- `src/components/Chip.tsx` — accepts onClick for filter chips
- `src/components/Card.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/components/ModelViewer.tsx` — wraps `<model-viewer>` web component
- `src/components/WordCloud.tsx` — dynamic font-size 16–48px
- `src/components/MoodInput.tsx` — textarea with char counter
- `src/components/EntryTable.tsx`
- `src/components/StatCard.tsx`
- `src/pages/EmployeeHome.tsx` — mascot + input + word cloud + date nav
- `src/pages/MascotPicker.tsx` — full-screen overlay, 4-card grid
- `src/pages/AdminLogin.tsx`
- `src/pages/AdminDashboard.tsx` — stats + filter chips + table + pagination

---

## Task 1: Workspace Scaffold

**Files:**
- Create: `e:/Working/Moodaily/pnpm-workspace.yaml`
- Create: `e:/Working/Moodaily/package.json`
- Create: `e:/Working/Moodaily/.gitignore`

- [ ] **Step 1: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "moodaily",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter @moodaily/api dev",
    "dev:web": "pnpm --filter @moodaily/web dev",
    "build": "pnpm --filter @moodaily/web build && cp -r mascot packages/api/public/mascot",
    "test": "pnpm --filter @moodaily/api test"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
packages/api/public/
packages/api/src/generated/
packages/api/.env
*.env.local
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml package.json .gitignore
git commit -m "chore: initialize pnpm workspace"
```

---

## Task 2: Backend Package Setup

**Files:**
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/api/vitest.config.ts`

- [ ] **Step 1: Create packages/api/package.json**

```json
{
  "name": "@moodaily/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:generate": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@fastify/static": "^8.0.0",
    "@fastify/websocket": "^11.0.0",
    "@google/generative-ai": "^0.21.0",
    "@prisma/client": "^6.0.0",
    "@vegabase/api": "^0.1.0",
    "@vegabase/core": "^0.1.0",
    "@vegabase/service": "^0.1.0",
    "argon2": "^0.31.2",
    "fastify": "^5.0.0",
    "openai": "^4.77.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "dotenv": "^16.4.0",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create packages/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create packages/api/vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
  },
});
```

- [ ] **Step 4: Install dependencies**

```bash
cd e:/Working/Moodaily
pnpm install
```

Expected: `packages/api/node_modules/` created with all dependencies.

- [ ] **Step 5: Commit**

```bash
git add packages/api/
git commit -m "chore: add api package setup (package.json, tsconfig, vitest)"
```

---

## Task 3: Prisma Schema & DB Push

**Files:**
- Create: `packages/api/prisma/schema.prisma`

- [ ] **Step 1: Create packages/api/prisma/schema.prisma**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model MoodEntry {
  id             String        @id
  rawText        String
  isDeleted      Boolean       @default(false)
  logCreatedDate DateTime
  logCreatedBy   String
  logUpdatedDate DateTime?
  logUpdatedBy   String?

  clusters       MoodCluster[]

  @@index([isDeleted])
  @@index([logCreatedDate, isDeleted])
}

model MoodCluster {
  id             String     @id
  entryId        String
  phrase         String
  isDeleted      Boolean    @default(false)
  logCreatedDate DateTime
  logCreatedBy   String
  logUpdatedDate DateTime?
  logUpdatedBy   String?

  entry          MoodEntry  @relation(fields: [entryId], references: [id])

  @@index([isDeleted])
  @@index([entryId, isDeleted])
  @@index([logCreatedDate, isDeleted])
}

model User {
  id             String    @id
  username       String
  passwordHash   String
  isDeleted      Boolean   @default(false)
  logCreatedDate DateTime
  logCreatedBy   String
  logUpdatedDate DateTime?
  logUpdatedBy   String?

  @@unique([username, isDeleted])
  @@index([isDeleted])
}
```

- [ ] **Step 2: Generate Prisma client and push schema to DB**

```bash
cd e:/Working/Moodaily/packages/api
pnpm db:generate
pnpm db:push
```

Expected:
```
Your database is now in sync with your Prisma schema.
✓ Generated Prisma Client (v6.x) to ./node_modules/.prisma/client
```

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/api/prisma/schema.prisma
git commit -m "feat(db): add Prisma schema for MoodEntry, MoodCluster, User"
```

---

## Task 4: Env Validation

**Files:**
- Create: `packages/api/src/env.ts`
- Create: `packages/api/src/env.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/src/env.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateEnvValues } from './env.js';

describe('validateEnvValues', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost/test',
    JWT_SECRET: 'a'.repeat(32),
    AI_PROVIDER: 'gemini' as const,
    GEMINI_API_KEY: 'AIzaSy_test',
    OPENAI_API_KEY: '',
  };

  it('passes with valid gemini config', () => {
    const result = validateEnvValues(base);
    expect(result.AI_PROVIDER).toBe('gemini');
    expect(result.PORT).toBe(3000);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnvValues({ ...base, DATABASE_URL: undefined } as any)).toThrow();
  });

  it('throws when AI_PROVIDER is invalid', () => {
    expect(() => validateEnvValues({ ...base, AI_PROVIDER: 'anthropic' } as any)).toThrow();
  });

  it('throws when AI_PROVIDER=gemini but GEMINI_API_KEY is empty', () => {
    expect(() => validateEnvValues({ ...base, GEMINI_API_KEY: '' })).toThrow();
  });

  it('throws when AI_PROVIDER=openai but OPENAI_API_KEY is empty', () => {
    expect(() => validateEnvValues({
      ...base,
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: '',
      GEMINI_API_KEY: '',
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Working/Moodaily/packages/api
pnpm test src/env.test.ts
```

Expected: FAIL — `validateEnvValues` not found.

- [ ] **Step 3: Create packages/api/src/env.ts**

```ts
import { z } from 'zod';

const base = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  AI_PROVIDER: z.enum(['openai', 'gemini']),
  OPENAI_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
});

const schema = base.superRefine((data, ctx) => {
  if (data.AI_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['OPENAI_API_KEY'], message: 'Required when AI_PROVIDER=openai' });
  }
  if (data.AI_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'Required when AI_PROVIDER=gemini' });
  }
});

export type Env = z.infer<typeof base>;

export function validateEnvValues(raw: Record<string, unknown>): Env {
  return schema.parse(raw) as Env;
}

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data as Env;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Working/Moodaily/packages/api
pnpm test src/env.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/env.ts packages/api/src/env.test.ts
git commit -m "feat(api): add Zod env validation with fail-fast on startup"
```

---

## Task 5: Infrastructure Layer

**Files:**
- Create: `packages/api/src/infrastructure/prisma.ts`
- Create: `packages/api/src/infrastructure/executor.ts`
- Create: `packages/api/src/infrastructure/permission-cache.ts`

- [ ] **Step 1: Create packages/api/src/infrastructure/prisma.ts**

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 2: Create packages/api/src/infrastructure/executor.ts**

```ts
import { DbActionExecutor } from '@vegabase/service';

export const executor = new DbActionExecutor();
```

- [ ] **Step 3: Create packages/api/src/infrastructure/permission-cache.ts**

```ts
import { PermissionCache } from '@vegabase/service';

export const permissionCache = new PermissionCache(async (_roleId) => [
  'MDY_ENTRY:VIEW',
  'MDY_ENTRY:ADD',
  'MDY_ENTRY:UPDATE',
  'MDY_ENTRY:DELETE',
  'MDY_CLUSTER:VIEW',
  'MDY_CLUSTER:DELETE',
]);
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/infrastructure/
git commit -m "feat(api): add infrastructure singletons (Prisma, DbActionExecutor, PermissionCache)"
```

---

## Task 6: Screen Codes

**Files:**
- Create: `packages/api/src/core/screen-codes.ts`

- [ ] **Step 1: Create packages/api/src/core/screen-codes.ts**

```ts
export const ScreenCodes = {
  MDY_ENTRY:   'MDY_ENTRY',
  MDY_CLUSTER: 'MDY_CLUSTER',
} as const;

export type ScreenCode = typeof ScreenCodes[keyof typeof ScreenCodes];
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/core/screen-codes.ts
git commit -m "feat(api): add ScreenCodes constants (NS-10)"
```

---

## Task 7: MoodEntry Service

**Files:**
- Create: `packages/api/src/service/mood-entry/mood-entry-param.ts`
- Create: `packages/api/src/service/mood-entry/mood-entry-schemas.ts`
- Create: `packages/api/src/service/mood-entry/mood-entry-service.ts`
- Create: `packages/api/src/service/mood-entry/mood-entry-service.test.ts`

- [ ] **Step 1: Create mood-entry-param.ts**

```ts
import type { BaseParamModel } from '@vegabase/service';

export interface MoodEntryParam extends BaseParamModel {
  date?: string;     // exact day filter YYYY-MM-DD
  dateFrom?: string; // range: from this date onwards (for stats)
  keyword?: string;  // rawText search
}
```

- [ ] **Step 2: Create mood-entry-schemas.ts**

```ts
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
```

- [ ] **Step 3: Write the failing integration test**

Create `packages/api/src/service/mood-entry/mood-entry-service.test.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd e:/Working/Moodaily/packages/api
pnpm test src/service/mood-entry/mood-entry-service.test.ts
```

Expected: FAIL — `MoodEntryService` not found.

- [ ] **Step 5: Create mood-entry-service.ts**

```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd e:/Working/Moodaily/packages/api
pnpm test src/service/mood-entry/mood-entry-service.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/service/mood-entry/
git commit -m "feat(api): add MoodEntryService with cascade delete, date filter, cluster count"
```

---

## Task 8: AI Provider Plugin

**Files:**
- Create: `packages/api/src/api/plugins/ai-provider.ts`
- Create: `packages/api/src/api/plugins/ai-provider.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/src/api/plugins/ai-provider.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

// Mirror the parsing logic to test independently (no real API calls)
function parseClusterResponse(raw: string): string[] {
  const clean = raw.replace(/^```json\s*/m, '').replace(/\s*```\s*$/, '').trim();
  const parsed: unknown = JSON.parse(clean);
  if (Array.isArray(parsed)) return parsed as string[];
  if (typeof parsed === 'object' && parsed !== null) {
    for (const v of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as string[];
    }
  }
  return [];
}

describe('parseClusterResponse', () => {
  it('parses a plain JSON array', () => {
    expect(parseClusterResponse('["vui vẻ","hạnh phúc"]')).toEqual(['vui vẻ', 'hạnh phúc']);
  });

  it('strips markdown code block before parsing', () => {
    expect(parseClusterResponse('```json\n["buồn bã"]\n```')).toEqual(['buồn bã']);
  });

  it('extracts array from object response', () => {
    expect(parseClusterResponse('{"clusters":["lo lắng","mệt mỏi"]}')).toEqual(['lo lắng', 'mệt mỏi']);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseClusterResponse('not json')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Working/Moodaily/packages/api
pnpm test src/api/plugins/ai-provider.test.ts
```

Expected: PASS immediately — the helper is defined inline in the test. If tests fail, check the regex patterns.

- [ ] **Step 3: Create packages/api/src/api/plugins/ai-provider.ts**

```ts
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../env.js';

export interface AiProvider {
  extractClusters(text: string): Promise<string[]>;
}

function parseClusterResponse(raw: string): string[] {
  const clean = raw.replace(/^```json\s*/m, '').replace(/\s*```\s*$/, '').trim();
  const parsed: unknown = JSON.parse(clean);
  if (Array.isArray(parsed)) return parsed as string[];
  if (typeof parsed === 'object' && parsed !== null) {
    for (const v of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as string[];
    }
  }
  return [];
}

const PROMPT = (text: string) =>
  `Trích xuất tối đa 6 cụm cảm xúc ngắn (2–5 từ) từ câu tiếng Việt sau, trả JSON array thuần (không markdown): ${text}`;

class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async extractClusters(text: string): Promise<string[]> {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: PROMPT(text) }],
    });
    return parseClusterResponse(res.choices[0]?.message?.content ?? '[]');
  }
}

class GeminiProvider implements AiProvider {
  private genModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractClusters(text: string): Promise<string[]> {
    const result = await this.genModel.generateContent(PROMPT(text));
    return parseClusterResponse(result.response.text());
  }
}

export function createAiProvider(): AiProvider {
  if (env.AI_PROVIDER === 'openai') return new OpenAiProvider(env.OPENAI_API_KEY);
  return new GeminiProvider(env.GEMINI_API_KEY);
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/api/plugins/ai-provider.ts packages/api/src/api/plugins/ai-provider.test.ts
git commit -m "feat(api): add AI provider abstraction (OpenAI + Gemini, switchable via env)"
```

---

## Task 9: WebSocket Hub

**Files:**
- Create: `packages/api/src/api/plugins/ws-hub.ts`

- [ ] **Step 1: Create packages/api/src/api/plugins/ws-hub.ts**

```ts
import type { WebSocket } from '@fastify/websocket';

const clients = new Set<WebSocket>();

export const wsHub = {
  add(ws: WebSocket): void {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  },
  broadcast(data: unknown): void {
    const msg = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) client.send(msg);
    }
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/api/plugins/ws-hub.ts
git commit -m "feat(api): add in-memory WebSocket hub with auto-cleanup on close"
```

---

## Task 10: Public Route — Mood Submit

**Files:**
- Create: `packages/api/src/api/routes/mood.ts`

- [ ] **Step 1: Create packages/api/src/api/routes/mood.ts**

```ts
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
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

    const entryResult = await executor.addAsync(
      prisma.moodEntry,
      { rawText: body.rawText },
      'anonymous',
    );
    if (!entryResult.isSuccess) {
      return reply.status(500).send(
        failResponse([{ code: 'DB_ERROR', message: 'Failed to save entry' }], traceId),
      );
    }

    const { id: entryId } = entryResult.data;

    if (clusters.length > 0) {
      await executor.addRangeAsync(
        prisma.moodCluster,
        clusters.map(phrase => ({ entryId, phrase })),
        'anonymous',
      );
    }

    wsHub.broadcast({ type: 'cloud-update', data: await getTodayWords() });

    return reply.status(201).send(successResponse({ entryId, clusters }, traceId));
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/api/routes/mood.ts
git commit -m "feat(api): add POST /api/mood/submit — AI clustering + DB save + WS broadcast"
```

---

## Task 11: Public Routes — Word Cloud & WebSocket

**Files:**
- Create: `packages/api/src/api/routes/cloud.ts`

- [ ] **Step 1: Create packages/api/src/api/routes/cloud.ts**

```ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { successResponse } from '@vegabase/core';
import { prisma } from '../../infrastructure/prisma.js';
import { wsHub } from '../plugins/ws-hub.js';

const cloudQuerySchema = z.object({ date: z.string().optional() });

async function getWordsForDate(dateStr?: string) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/api/routes/cloud.ts
git commit -m "feat(api): add GET /api/cloud and WebSocket /api/cloud/ws"
```

---

## Task 12: Public Route — Admin Login

**Files:**
- Create: `packages/api/src/api/routes/admin.ts`

- [ ] **Step 1: Create packages/api/src/api/routes/admin.ts**

```ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { successResponse, failResponse } from '@vegabase/core';
import { Argon2idHasher } from '@vegabase/api';
import { prisma } from '../../infrastructure/prisma.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const hasher = new Argon2idHasher();

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/admin/login', async (req, reply) => {
    const traceId = crypto.randomUUID();
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({ where: { username, isDeleted: false } });
    if (!user) {
      return reply.status(401).send(
        failResponse([{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }], traceId),
      );
    }

    const valid = await hasher.verify(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send(
        failResponse([{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }], traceId),
      );
    }

    // req.server.jwt is decorated by vegabaseJwtPlugin (registered on the root app via fastify-plugin)
    const token = (req.server as any).jwt.sign(
      { sub: user.username, roles: ['admin'] },
      { expiresIn: '8h' },
    );

    return reply.send(successResponse({ token }, traceId));
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/api/routes/admin.ts
git commit -m "feat(api): add POST /api/admin/login with Argon2id verification"
```

---

## Task 13: Protected Route — Entries Controller

**Files:**
- Create: `packages/api/src/api/routes/entries.ts`

- [ ] **Step 1: Create packages/api/src/api/routes/entries.ts**

```ts
import { createBaseController } from '@vegabase/api';
import { MoodEntryService } from '../../service/mood-entry/mood-entry-service.js';
import {
  moodEntryListSchema,
  moodEntryDeleteSchema,
} from '../../service/mood-entry/mood-entry-schemas.js';
import { prisma } from '../../infrastructure/prisma.js';
import { executor } from '../../infrastructure/executor.js';
import { permissionCache } from '../../infrastructure/permission-cache.js';

const moodEntryService = new MoodEntryService(prisma, executor, permissionCache);

export const entriesController = createBaseController({
  service: moodEntryService,
  prefix: '/api/admin/entries',
  schemas: {
    list: moodEntryListSchema,
    add: moodEntryListSchema,    // add route not used; schema satisfies type
    update: moodEntryListSchema, // update route not used; schema satisfies type
    delete: moodEntryDeleteSchema,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/api/src/api/routes/entries.ts
git commit -m "feat(api): add /api/admin/entries CRUD via createBaseController (list + delete)"
```

---

## Task 14: Server Assembly

**Files:**
- Create: `packages/api/src/api/server.ts`
- Create: `packages/api/src/index.ts`

- [ ] **Step 1: Create packages/api/src/api/server.ts**

```ts
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebSocket from '@fastify/websocket';
import { join } from 'path';
import { fileURLToPath } from 'url';
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
  //    Routes registered here do not get the onRequest JWT check
  await app.register(moodRoutes);
  await app.register(cloudRoutes);
  await app.register(adminRoutes);

  // 3. JWT plugin — adds onRequest hook; only applies to routes registered AFTER this point
  await app.register(vegabaseJwtPlugin, {
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  // 4. Caller info — extracts sub + roles from JWT payload into req.caller
  await app.register(callerInfoPlugin);

  // 5. Protected routes — registered AFTER JWT (LA-09)
  await app.register(entriesController);

  // Static files: serve built React SPA in production
  const publicPath = join(__dirname, '../../public');
  try {
    await app.register(fastifyStatic, {
      root: publicPath,
      prefix: '/',
      decorateReply: false,
    });
    // SPA fallback: unknown routes serve index.html
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html');
    });
  } catch {
    // public/ folder absent in dev — skip static serving
  }

  return app;
}
```

- [ ] **Step 2: Create packages/api/src/index.ts**

```ts
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
```

- [ ] **Step 3: Start the dev server and smoke-test**

```bash
cd e:/Working/Moodaily/packages/api
pnpm dev
```

Expected: `Server listening at http://0.0.0.0:3000`

Test the public endpoint:
```bash
curl -s -X POST http://localhost:3000/api/mood/submit \
  -H "Content-Type: application/json" \
  -d '{"rawText":"Hôm nay tôi rất vui và hào hứng"}' | head -c 200
```

Expected: `{"success":true,"data":{"entryId":"...","clusters":["...",...]}}`

Test JWT protection:
```bash
curl -s http://localhost:3000/api/admin/entries/list
```

Expected: 401 response with `UNAUTHORIZED` code.

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/api/server.ts packages/api/src/index.ts
git commit -m "feat(api): assemble Fastify server with LA-09 plugin ordering"
```

---

## Task 15: Admin Seed Script

**Files:**
- Create: `packages/api/prisma/seed.ts`

- [ ] **Step 1: Create packages/api/prisma/seed.ts**

```ts
import { PrismaClient } from '@prisma/client';
import { DbActionExecutor } from '@vegabase/service';
import { Argon2idHasher } from '@vegabase/api';

const prisma = new PrismaClient();
const executor = new DbActionExecutor();
const hasher = new Argon2idHasher();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'moodaily2024';

  const existing = await prisma.user.findFirst({ where: { username, isDeleted: false } });
  if (existing) {
    console.log(`Admin user "${username}" already exists — skipping.`);
    return;
  }

  const passwordHash = await hasher.hash(password);
  const result = await executor.addAsync(prisma.user, { username, passwordHash }, 'seed');
  if (result.isSuccess) {
    console.log(`✅ Admin user "${username}" created.`);
  } else {
    console.error('❌ Failed to create admin user:', result.error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

```bash
cd e:/Working/Moodaily/packages/api
pnpm db:seed
```

Expected: `✅ Admin user "admin" created.`

Test login:
```bash
curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"moodaily2024"}'
```

Expected: `{"success":true,"data":{"token":"eyJ..."}}`

- [ ] **Step 3: Commit**

```bash
git add packages/api/prisma/seed.ts
git commit -m "feat(api): add admin seed script with Argon2id password hashing"
```

---

## Task 16: Frontend Package Setup

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/index.html`

- [ ] **Step 1: Create packages/web/package.json**

```json
{
  "name": "@moodaily/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create packages/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src", "index.html"]
}
```

- [ ] **Step 3: Create packages/web/vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/mascot': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../api/public',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 4: Create packages/web/index.html**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moodaily</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install web dependencies**

```bash
cd e:/Working/Moodaily
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/
git commit -m "feat(web): scaffold React+Vite frontend package"
```

---

## Task 17: CSS Themes

**Files:**
- Create: `packages/web/src/themes.css`

- [ ] **Step 1: Create packages/web/src/themes.css**

```css
/* Default theme: Chick (amber) */
:root {
  --font: 'Plus Jakarta Sans', sans-serif;
  --radius: 16px;
  --radius-sm: 8px;
  --surface: #fff8e8;
  --primary: #b8690a;
  --primary-container: #f5d9a8;
  --on-primary-container: #5c3200;
  --secondary: #c47e2a;
  --secondary-container: #faecd4;
  --text: #3a2800;
  --text-secondary: #7a5c2e;
  --border: #e8d5a8;
  --shadow: 0 2px 12px rgba(184, 105, 10, 0.10);
}

[data-theme="axolotl"] {
  --surface: #fff0f2;
  --primary: #c0284a;
  --primary-container: #f5b8c4;
  --on-primary-container: #6b0020;
  --secondary: #d4607a;
  --secondary-container: #fad4dc;
  --text: #3d0015;
  --text-secondary: #8a3a50;
  --border: #f0c0ca;
  --shadow: 0 2px 12px rgba(192, 40, 74, 0.10);
}

[data-theme="mocha"] {
  --surface: #fdf5ec;
  --primary: #7a5230;
  --primary-container: #e0c4a0;
  --on-primary-container: #3d2210;
  --secondary: #c4956a;
  --secondary-container: #f5e0cc;
  --text: #2e1800;
  --text-secondary: #7a5230;
  --border: #e0c4a0;
  --shadow: 0 2px 12px rgba(122, 82, 48, 0.10);
}

[data-theme="whale"] {
  --surface: #f0f6ff;
  --primary: #1e6fa8;
  --primary-container: #7ec4ef;
  --on-primary-container: #0d3d62;
  --secondary: #2e8b7a;
  --secondary-container: #a8e6df;
  --text: #0a2840;
  --text-secondary: #2a5a7a;
  --border: #b8d8f0;
  --shadow: 0 2px 12px rgba(30, 111, 168, 0.10);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font);
  background: var(--surface);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/themes.css
git commit -m "feat(web): add 4-mascot CSS theme system with custom properties"
```

---

## Task 18: Base UI Components

**Files:**
- Create: `packages/web/src/components/Button.tsx`
- Create: `packages/web/src/components/Chip.tsx`
- Create: `packages/web/src/components/Card.tsx`
- Create: `packages/web/src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Create Button.tsx**

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
  const pad = size === 'sm' ? '6px 14px' : '10px 22px';
  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: 'var(--primary)', color: '#fff', padding: pad } :
    variant === 'secondary' ? { background: 'var(--secondary-container)', color: 'var(--on-primary-container)', padding: pad } :
    variant === 'danger'    ? { background: '#e53935', color: '#fff', padding: pad } :
                              { background: 'transparent', color: 'var(--primary)', padding: pad };

  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
        fontWeight: 600, borderRadius: 'var(--radius-sm)',
        transition: 'opacity 0.15s', fontSize: size === 'sm' ? 13 : 15,
        ...variantStyle, ...style,
      }}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create Chip.tsx**

```tsx
interface ChipProps {
  label: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Chip({ label, style, onClick }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
        fontSize: 12, fontWeight: 600,
        background: 'var(--primary-container)',
        color: 'var(--on-primary-container)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create Card.tsx**

```tsx
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
      padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create ConfirmDialog.tsx**

```tsx
import { Button } from './Button.js';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: 32, maxWidth: 400, width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <p style={{ marginBottom: 24, fontWeight: 500, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Hủy</Button>
          <Button variant="danger" onClick={onConfirm}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/Button.tsx packages/web/src/components/Chip.tsx \
        packages/web/src/components/Card.tsx packages/web/src/components/ConfirmDialog.tsx
git commit -m "feat(web): add base UI components (Button, Chip, Card, ConfirmDialog)"
```

---

## Task 19: ModelViewer Component

**Files:**
- Create: `packages/web/src/components/ModelViewer.tsx`

- [ ] **Step 1: Create packages/web/src/components/ModelViewer.tsx**

```tsx
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean | '';
        'camera-controls'?: boolean | '';
        'tone-mapping'?: string;
        'environment-image'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
      };
    }
  }
}

export type MascotKey = 'chick' | 'axolotl' | 'mocha' | 'whale';

const MASCOT_FILES: Record<MascotKey, string> = {
  chick:   '/mascot/cute_chick.glb',
  axolotl: '/mascot/cute_axolotl.glb',
  mocha:   '/mascot/cute_mocha_cat_3.glb',
  whale:   '/mascot/cute_whale.glb',
};

interface ModelViewerProps {
  mascot: MascotKey;
  style?: React.CSSProperties;
  cameraControls?: boolean;
}

export function ModelViewer({ mascot, style, cameraControls }: ModelViewerProps) {
  return (
    <model-viewer
      src={MASCOT_FILES[mascot]}
      alt={`${mascot} mascot`}
      auto-rotate=""
      camera-controls={cameraControls ? '' : undefined}
      tone-mapping="commerce"
      environment-image="neutral"
      shadow-intensity="0.6"
      exposure="1.1"
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/ModelViewer.tsx
git commit -m "feat(web): add ModelViewer component wrapping @google/model-viewer"
```

---

## Task 20: WordCloud Component

**Files:**
- Create: `packages/web/src/components/WordCloud.tsx`

- [ ] **Step 1: Create packages/web/src/components/WordCloud.tsx**

```tsx
export interface WordItem {
  phrase: string;
  count: number;
}

interface WordCloudProps {
  words: WordItem[];
}

export function WordCloud({ words }: WordCloudProps) {
  if (words.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: 15 }}>
        Chưa có cảm xúc nào được chia sẻ hôm nay
      </div>
    );
  }

  const maxCount = Math.max(...words.map(w => w.count));
  const minCount = Math.min(...words.map(w => w.count));

  function fontSize(count: number): number {
    if (maxCount === minCount) return 28;
    return Math.round(16 + ((count - minCount) / (maxCount - minCount)) * 32);
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '10px 18px',
      justifyContent: 'center', alignItems: 'center', padding: '24px 0',
    }}>
      {words.map(({ phrase, count }) => (
        <span
          key={phrase}
          title={`${count} lần`}
          style={{
            fontSize: fontSize(count),
            fontWeight: 600,
            color: 'var(--primary)',
            opacity: 0.55 + (count / maxCount) * 0.45,
            transition: 'font-size 0.3s ease',
            cursor: 'default',
          }}
        >
          {phrase}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): add WordCloud component with 16–48px dynamic font sizing"
```

---

## Task 21: MoodInput Component

**Files:**
- Create: `packages/web/src/components/MoodInput.tsx`

- [ ] **Step 1: Create packages/web/src/components/MoodInput.tsx**

```tsx
import { useState } from 'react';
import { Button } from './Button.js';

interface MoodInputProps {
  onSubmit: (text: string) => Promise<void>;
}

export function MoodInput({ onSubmit }: MoodInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MAX = 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(text.trim());
      setSubmitted(true);
      setText('');
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  const nearLimit = text.length > MAX - 50;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX))}
        placeholder="Hôm nay bạn cảm thấy thế nào? (ẩn danh)"
        rows={4}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${nearLimit ? 'var(--primary)' : 'var(--border)'}`,
          fontFamily: 'var(--font)', fontSize: 15, resize: 'none', outline: 'none',
          background: 'var(--surface)', color: 'var(--text)',
          transition: 'border-color 0.2s',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: nearLimit ? 'var(--primary)' : 'var(--text-secondary)' }}>
          {text.length}/{MAX}
        </span>
        <Button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Đang gửi...' : submitted ? '✓ Đã gửi!' : 'Gửi cảm xúc'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/MoodInput.tsx
git commit -m "feat(web): add MoodInput textarea with char counter and submit feedback"
```

---

## Task 22: EntryTable & StatCard Components

**Files:**
- Create: `packages/web/src/components/StatCard.tsx`
- Create: `packages/web/src/components/EntryTable.tsx`

- [ ] **Step 1: Create StatCard.tsx**

```tsx
import { Card } from './Card.js';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
```

- [ ] **Step 2: Create EntryTable.tsx**

```tsx
import { Chip } from './Chip.js';
import { Button } from './Button.js';

export interface EntryRow {
  id: string;
  logCreatedDate: string;
  rawText: string;
  _clusterCount?: number;
}

interface EntryTableProps {
  entries: EntryRow[];
  onDelete: (id: string) => void;
}

export function EntryTable({ entries, onDelete }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
        Không có entries
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13,
  };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={thStyle}>Thời gian</th>
            <th style={thStyle}>Nội dung</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Cụm</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Xóa</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                {new Date(entry.logCreatedDate).toLocaleString('vi-VN')}
              </td>
              <td style={{ ...tdStyle, maxWidth: 400 }}>
                {entry.rawText.length > 80 ? entry.rawText.slice(0, 80) + '…' : entry.rawText}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Chip label={String(entry._clusterCount ?? 0)} />
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onDelete(entry.id)}
                  style={{ color: '#e53935' }}
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/StatCard.tsx packages/web/src/components/EntryTable.tsx
git commit -m "feat(web): add StatCard and EntryTable components"
```

---

## Task 23: API Client & WebSocket Hook

**Files:**
- Create: `packages/web/src/lib/api.ts`
- Create: `packages/web/src/hooks/useCloudSocket.ts`

- [ ] **Step 1: Create packages/web/src/lib/api.ts**

```ts
const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('moodaily-token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.errors?.[0]?.message ?? 'Request failed');
  return json.data as T;
}

export const api = {
  submitMood: (rawText: string) =>
    request<{ entryId: string; clusters: string[] }>('/mood/submit', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),

  getCloud: (date?: string) =>
    request<{ date: string; words: { phrase: string; count: number }[] }>(
      `/cloud${date ? `?date=${date}` : ''}`,
    ),

  login: (username: string, password: string) =>
    request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getEntries: (params: {
    page?: number;
    pageSize?: number;
    date?: string;
    dateFrom?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.page)     q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.date)     q.set('date', params.date);
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.keyword)  q.set('keyword', params.keyword);
    return request<{ items: any[]; total: number }>(`/admin/entries/list?${q}`);
  },

  deleteEntry: (id: string) =>
    request<boolean>(`/admin/entries/delete?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
```

- [ ] **Step 2: Create packages/web/src/hooks/useCloudSocket.ts**

```ts
import { useState, useEffect } from 'react';
import type { WordItem } from '../components/WordCloud.js';

export function useCloudSocket(initialWords: WordItem[]) {
  const [words, setWords] = useState<WordItem[]>(initialWords);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/cloud/ws`);

    ws.onmessage = (event) => {
      try {
        const msg: unknown = JSON.parse(event.data as string);
        if (
          typeof msg === 'object' && msg !== null &&
          (msg as any).type === 'cloud-update'
        ) {
          setWords((msg as any).data as WordItem[]);
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, []);

  // Sync when parent passes fresh initial words (e.g. date change)
  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  return words;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/lib/api.ts packages/web/src/hooks/useCloudSocket.ts
git commit -m "feat(web): add typed API client and WebSocket hook"
```

---

## Task 24: MascotPicker Page

**Files:**
- Create: `packages/web/src/pages/MascotPicker.tsx`

- [ ] **Step 1: Create packages/web/src/pages/MascotPicker.tsx**

```tsx
import { ModelViewer, type MascotKey } from '../components/ModelViewer.js';

const MASCOTS: { key: MascotKey; label: string; primary: string }[] = [
  { key: 'chick',   label: '🐥 Chick',    primary: '#b8690a' },
  { key: 'axolotl', label: '🦎 Axolotl',  primary: '#c0284a' },
  { key: 'mocha',   label: '🐱 Mocha Cat', primary: '#7a5230' },
  { key: 'whale',   label: '🐋 Whale',    primary: '#1e6fa8' },
];

interface MascotPickerProps {
  current: MascotKey;
  onSelect: (key: MascotKey) => void;
  onClose?: () => void;
}

export function MascotPicker({ current, onSelect, onClose }: MascotPickerProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 900, padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 24, padding: 32,
        maxWidth: 580, width: '100%', boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8, color: 'var(--text)' }}>
          Chọn linh vật
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>
          Theme màu sắc sẽ thay đổi theo linh vật bạn chọn
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {MASCOTS.map(m => (
            <button
              key={m.key}
              onClick={() => { onSelect(m.key); onClose?.(); }}
              style={{
                background: current === m.key ? m.primary + '1a' : '#fff',
                border: `${current === m.key ? 2.5 : 1.5}px solid ${current === m.key ? m.primary : 'var(--border)'}`,
                borderRadius: 16, padding: '16px 12px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 100, height: 120 }}>
                <ModelViewer mascot={m.key} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14 }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'block', margin: '24px auto 0', background: 'none',
              border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 14,
            }}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/pages/MascotPicker.tsx
git commit -m "feat(web): add MascotPicker overlay with 4-mascot selection grid"
```

---

## Task 25: EmployeeHome Page

**Files:**
- Create: `packages/web/src/pages/EmployeeHome.tsx`

- [ ] **Step 1: Create packages/web/src/pages/EmployeeHome.tsx**

```tsx
import { useState, useEffect } from 'react';
import { ModelViewer, type MascotKey } from '../components/ModelViewer.js';
import { MoodInput } from '../components/MoodInput.js';
import { WordCloud } from '../components/WordCloud.js';
import { MascotPicker } from './MascotPicker.js';
import { api } from '../lib/api.js';
import { useCloudSocket } from '../hooks/useCloudSocket.js';

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function EmployeeHome() {
  const [mascot, setMascot] = useState<MascotKey>(
    () => (localStorage.getItem('moodaily-mascot') as MascotKey | null) ?? 'chick',
  );
  const [showPicker, setShowPicker] = useState(
    () => !localStorage.getItem('moodaily-mascot'),
  );
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [initialWords, setInitialWords] = useState<{ phrase: string; count: number }[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);

  const words = useCloudSocket(initialWords);
  const today = toDateStr(new Date());

  function applyMascot(key: MascotKey) {
    setMascot(key);
    localStorage.setItem('moodaily-mascot', key);
    document.documentElement.dataset.theme = key;
  }

  useEffect(() => {
    document.documentElement.dataset.theme = mascot;
  }, [mascot]);

  useEffect(() => {
    setLoadingWords(true);
    api.getCloud(date)
      .then(d => { setInitialWords(d.words); setLoadingWords(false); })
      .catch(() => setLoadingWords(false));
  }, [date]);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(toDateStr(d));
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>Moodaily</span>
        <button
          onClick={() => setShowPicker(true)}
          title="Đổi linh vật"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          🎨
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <div style={{ width: 200, height: 240, margin: '0 auto 32px' }}>
          <ModelViewer mascot={mascot} cameraControls />
        </div>

        <MoodInput onSubmit={text => api.submitMood(text)} />

        {/* Date navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '32px 0 16px' }}>
          <button
            onClick={() => shiftDate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--primary)' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 100, textAlign: 'center' }}>
            {date === today ? 'Hôm nay' : date}
          </span>
          <button
            onClick={() => shiftDate(1)}
            disabled={date >= today}
            style={{
              background: 'none', border: 'none', fontSize: 22,
              cursor: date >= today ? 'default' : 'pointer',
              color: date >= today ? 'var(--border)' : 'var(--primary)',
            }}
          >
            →
          </button>
        </div>

        {loadingWords
          ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>Đang tải...</div>
          : <WordCloud words={words} />
        }
      </main>

      {showPicker && (
        <MascotPicker current={mascot} onSelect={applyMascot} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/pages/EmployeeHome.tsx
git commit -m "feat(web): add EmployeeHome with 3D mascot, mood input, word cloud, date nav"
```

---

## Task 26: AdminLogin Page

**Files:**
- Create: `packages/web/src/pages/AdminLogin.tsx`

- [ ] **Step 1: Create packages/web/src/pages/AdminLogin.tsx**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { api } from '../lib/api.js';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(username, password);
      localStorage.setItem('moodaily-token', token);
      navigate('/admin/dashboard');
    } catch {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
    fontSize: 15, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--surface)', padding: 24,
    }}>
      <Card style={{ maxWidth: 360, width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, color: 'var(--primary)' }}>
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text" placeholder="Tên đăng nhập"
            value={username} onChange={e => setUsername(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="Mật khẩu"
            value={password} onChange={e => setPassword(e.target.value)}
            required style={inputStyle}
          />
          {error && <p style={{ color: '#e53935', fontSize: 13 }}>{error}</p>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/pages/AdminLogin.tsx
git commit -m "feat(web): add AdminLogin page"
```

---

## Task 27: AdminDashboard Page

**Files:**
- Create: `packages/web/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Create packages/web/src/pages/AdminDashboard.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard.js';
import { EntryTable, type EntryRow } from '../components/EntryTable.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Button } from '../components/Button.js';
import { Chip } from '../components/Chip.js';
import { api } from '../lib/api.js';

const PAGE_SIZE = 20;

function subtractDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const DATE_FILTER_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week',  label: '7 ngày' },
  { key: 'month', label: '30 ngày' },
  { key: 'all',   label: 'Tất cả' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });

  function logout() {
    localStorage.removeItem('moodaily-token');
    navigate('/admin');
  }

  const loadEntries = useCallback(async () => {
    const params: Parameters<typeof api.getEntries>[0] = { page, pageSize: PAGE_SIZE };
    if (dateFilter === 'today') params.date = new Date().toISOString().slice(0, 10);
    if (dateFilter === 'week')  params.dateFrom = subtractDays(7);
    if (dateFilter === 'month') params.dateFrom = subtractDays(30);
    if (keyword) params.keyword = keyword;
    const res = await api.getEntries(params);
    setEntries(res.items as EntryRow[]);
    setTotal(res.total);
  }, [page, dateFilter, keyword]);

  useEffect(() => {
    if (!localStorage.getItem('moodaily-token')) { navigate('/admin'); return; }
    loadEntries();
  }, [loadEntries, navigate]);

  useEffect(() => {
    Promise.all([
      api.getEntries({ pageSize: 1, date: new Date().toISOString().slice(0, 10) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(7) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(30) }),
    ]).then(([today, week, month]) => {
      setStats({ today: today.total, week: week.total, month: month.total });
    }).catch(() => {});
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    await api.deleteEntry(deleteTarget);
    setDeleteTarget(null);
    loadEntries();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <header style={{
        padding: '14px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
        background: '#fff',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>Moodaily Admin</span>
        <Button variant="ghost" size="sm" onClick={logout}>Đăng xuất</Button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard label="Hôm nay" value={stats.today} />
          <StatCard label="7 ngày gần nhất" value={stats.week} />
          <StatCard label="30 ngày gần nhất" value={stats.month} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {DATE_FILTER_OPTIONS.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              onClick={() => { setDateFilter(f.key); setPage(1); }}
              style={{
                background: dateFilter === f.key ? 'var(--primary)' : 'var(--primary-container)',
                color: dateFilter === f.key ? '#fff' : 'var(--on-primary-container)',
              }}
            />
          ))}
          <input
            placeholder="Tìm kiếm nội dung..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            style={{
              marginLeft: 'auto', padding: '5px 14px', borderRadius: 20,
              border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
              fontSize: 13, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
            }}
          />
        </div>

        {/* Table */}
        <div style={{
          background: '#fff', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <EntryTable entries={entries} onDelete={id => setDeleteTarget(id)} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span style={{ padding: '6px 12px', color: 'var(--text)', fontSize: 14 }}>
              {page} / {totalPages}
            </span>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Bạn có chắc muốn xóa entry này? Hành động không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/pages/AdminDashboard.tsx
git commit -m "feat(web): add AdminDashboard with stats, date filters, table, pagination"
```

---

## Task 28: App Router & Main Entry

**Files:**
- Create: `packages/web/src/App.tsx`
- Create: `packages/web/src/main.tsx`

- [ ] **Step 1: Create packages/web/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeHome } from './pages/EmployeeHome.js';
import { AdminLogin } from './pages/AdminLogin.js';
import { AdminDashboard } from './pages/AdminDashboard.js';

export function App() {
  const hasToken = Boolean(localStorage.getItem('moodaily-token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeeHome />} />
        <Route
          path="/admin"
          element={hasToken ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={hasToken ? <AdminDashboard /> : <Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Create packages/web/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './themes.css';
import { App } from './App.js';

// Apply saved mascot theme before first render to prevent flash
const saved = localStorage.getItem('moodaily-mascot');
if (saved) document.documentElement.dataset.theme = saved;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Start the dev server and test the full flow**

Ensure the API server is running (`pnpm dev:api`), then:

```bash
cd e:/Working/Moodaily
pnpm dev:web
```

Open http://localhost:5173 and verify:
1. MascotPicker overlay appears on first visit (no saved mascot)
2. Select a mascot → theme changes immediately, overlay closes
3. Mascot 3D model renders via `<model-viewer>`
4. Type mood text and submit → word cloud updates
5. Navigate `←` to previous day → word cloud reloads
6. Navigate to `/admin` → AdminLogin shows
7. Login with `admin` / `moodaily2024` → redirected to AdminDashboard
8. Dashboard shows stat cards and entry table
9. Delete button shows ConfirmDialog; confirm → entry removed

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/App.tsx packages/web/src/main.tsx
git commit -m "feat(web): add React Router setup and app entry point"
```

---

## Task 29: Production Build & Mascot Static Serving

**Files:**
- Modify: `packages/api/src/api/server.ts` — add mascot static route
- Modify: `e:/Working/Moodaily/package.json` — ensure mascot copy in build script

- [ ] **Step 1: Add mascot static route to server.ts**

In `packages/api/src/api/server.ts`, add a second `fastifyStatic` registration after the existing one. Because `decorateReply: false` is set on the first registration, the second can use a different prefix:

```ts
// Add this import at the top:
import { join as pathJoin } from 'path';

// Add after the public static block, inside buildServer():
const mascotPath = pathJoin(process.cwd(), 'mascot');
await app.register(fastifyStatic, {
  root: mascotPath,
  prefix: '/mascot/',
  decorateReply: false,
});
```

The full updated `buildServer` function should register mascot static unconditionally (dev needs it too since GLBs live in `e:/Working/Moodaily/mascot/`).

- [ ] **Step 2: Build the production bundle**

```bash
cd e:/Working/Moodaily
pnpm build
```

Expected:
- Vite builds `packages/web/src/` → `packages/api/public/`
- `packages/api/public/mascot/` is populated (from the `cp -r mascot` step in root package.json build script)
- TypeScript compiles `packages/api/src/` → `packages/api/dist/`

- [ ] **Step 3: Start production server and verify**

```bash
cd e:/Working/Moodaily/packages/api
pnpm start
```

Open http://localhost:3000 and verify:
1. React SPA loads (served by Fastify static)
2. `/mascot/cute_chick.glb` returns the GLB file (200 OK)
3. Model viewer renders the 3D mascot
4. Submitting mood works end-to-end
5. Admin login and dashboard work
6. Browser refresh on `/admin/dashboard` does not 404 (SPA fallback active)

- [ ] **Step 4: Commit**

```bash
git add packages/api/src/api/server.ts
git commit -m "feat: wire production build — Vite → api/public, mascot static route on /mascot/"
```

---

*End of plan — 29 tasks, ~130 steps total.*
