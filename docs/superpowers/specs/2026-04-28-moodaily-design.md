# Moodaily — Design Spec
_2026-04-28_

## Overview

Moodaily là web app nội bộ cho nhân viên ghi mood ẩn danh hàng ngày. Nhân viên gõ tự do, AI trích "cụm cảm xúc" và hiển thị word cloud chung cho cả nhóm. Admin xem thống kê, quản lý entries.

---

## 1. Kiến trúc & Cấu trúc Project

**Stack:** TypeScript · Fastify 5 (VegaBase consumer) · Prisma · PostgreSQL · React + Vite · OpenAI / Gemini (switchable) · WebSocket

**Project layout** (pnpm workspace tại `e:/Working/Moodaily/`):

```
e:/Working/Moodaily/
├── pnpm-workspace.yaml
├── package.json                    # workspace root
├── .gitignore
├── mascot/                         # cute_chick.glb, cute_axolotl.glb,
│                                   # cute_mocha_cat_3.glb, cute_whale.glb
├── packages/
│   ├── api/                        # Fastify BE — VegaBase consumer
│   │   ├── .env                    # KHÔNG commit
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── core/screen-codes.ts
│   │       ├── service/
│   │       │   ├── mood-entry/
│   │       │   │   ├── mood-entry-service.ts
│   │       │   │   ├── mood-entry-param.ts
│   │       │   │   └── mood-entry-schemas.ts
│   │       │   └── mood-cluster/
│   │       │       ├── mood-cluster-service.ts
│   │       │       ├── mood-cluster-param.ts
│   │       │       └── mood-cluster-schemas.ts
│   │       ├── api/
│   │       │   ├── plugins/
│   │       │   │   ├── ai-provider.ts  # interface + factory (openai | gemini)
│   │       │   │   └── ws-hub.ts       # in-memory Set<WebSocket>, broadcast()
│   │       │   ├── routes/
│   │       │   │   ├── mood.ts     # POST /api/mood/submit (public)
│   │       │   │   ├── cloud.ts    # GET /api/cloud + WS /api/cloud/ws (public)
│   │       │   │   └── admin.ts    # POST /api/admin/login (public)
│   │       │   └── server.ts       # startup + plugin ordering
│   │       └── infrastructure/
│   │           ├── prisma.ts
│   │           ├── executor.ts
│   │           └── permission-cache.ts
│   └── web/                        # React + Vite FE
│       ├── index.html
│       ├── vite.config.ts          # proxy /api + /mascot → :3000
│       └── src/
│           ├── themes.css          # 4 theme overrides [data-theme=...]
│           ├── main.tsx
│           ├── App.tsx             # Router setup
│           ├── pages/
│           │   ├── EmployeeHome.tsx
│           │   ├── MascotPicker.tsx
│           │   ├── AdminLogin.tsx
│           │   └── AdminDashboard.tsx
│           └── components/
│               ├── ModelViewer.tsx
│               ├── WordCloud.tsx
│               ├── MoodInput.tsx
│               ├── EntryTable.tsx
│               ├── StatCard.tsx
│               ├── Button.tsx
│               ├── Chip.tsx
│               ├── Card.tsx
│               └── ConfirmDialog.tsx
```

**Auth split (Fastify plugin ordering — LA-09):**
```
1. errorHandlerPlugin
2. public routes (mood.ts, cloud.ts, admin login)   ← TRƯỚC JWT
3. vegabaseJwtPlugin
4. callerInfoPlugin
5. protected routes (entries controller, ...)       ← SAU JWT
```

**Dev:** Vite `:5173` proxy `/api` + `/mascot` → Fastify `:3000`.
**Production:** `pnpm build` → Vite output vào `packages/api/public/` → Fastify serve static.

---

## 2. 4 Mascot Themes

Mỗi mascot có palette riêng. Theme active = `<html data-theme="{key}">`.
Lưu lựa chọn trong `localStorage("moodaily-mascot")`. Default: `chick`.

| Mascot | Theme key | GLB file | Primary | Surface | Accent |
|---|---|---|---|---|---|
| 🐥 Chick | `chick` | `cute_chick.glb` | `#b8690a` amber | `#fff8e8` | `#e8943a` |
| 🦎 Axolotl | `axolotl` | `cute_axolotl.glb` | `#c0284a` coral | `#fff0f2` | `#e8a0aa` |
| 🐱 Mocha Cat | `mocha` | `cute_mocha_cat_3.glb` | `#7a5230` mocha | `#fdf5ec` | `#c4956a` |
| 🐋 Whale | `whale` | `cute_whale.glb` | `#1e6fa8` ocean | `#f0f6ff` | `#5aa4d4` |

CSS token override mẫu:
```css
[data-theme="whale"] {
  --surface: #f0f6ff;
  --primary: #1e6fa8;
  --primary-container: #7ec4ef;
  --on-primary-container: #0d3d62;
  --secondary: #2e8b7a;
  --secondary-container: #a8e6df;
}
```

**Mascot picker**: overlay full-screen lần đầu vào hoặc từ icon header. Hiển thị 4 thẻ với `<model-viewer>` nhỏ (100×120px) + tên. Chọn → apply theme ngay (không reload page).

---

## 3. Data Model (Prisma)

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
  logCreatedBy   String        // luôn "anonymous"
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

**Cascade soft-delete**: `MoodEntryService.checkDeleteCondition` gọi `executor.softDeleteAsync` cho tất cả clusters của entry trước khi xóa entry.

**Word cloud query**:
```sql
SELECT mc.phrase, COUNT(*) as count
FROM MoodCluster mc
JOIN MoodEntry me ON mc."entryId" = me.id
WHERE me."isDeleted" = false
  AND mc."isDeleted" = false
  AND DATE(me."logCreatedDate") = $1
GROUP BY mc.phrase
ORDER BY count DESC
```

---

## 4. API Routes

### Public (không cần JWT)

**`POST /api/mood/submit`**
- Body: `{ rawText: string }` — validate non-empty, max 500 chars
- Flow:
  1. Gọi AI provider (sync, ~1-2s):
     - Prompt: `"Trích xuất tối đa 6 cụm cảm xúc ngắn (2–5 từ) từ câu tiếng Việt sau, trả JSON array: {rawText}"`
     - Parse response → `string[]`
     - Provider chọn theo `AI_PROVIDER` env (`openai` | `gemini`)
  2. `executor.addAsync(moodEntry)` — `logCreatedBy = "anonymous"`
  3. `executor.addRangeAsync(clusters)`
  4. Tính lại word cloud hôm nay → `wsHub.broadcast({ type: "cloud-update", data })`
  5. Return `201 { entryId, clusters }`
- Lỗi OpenAI: lưu entry với clusters rỗng, vẫn return 201, log server-side.

**`GET /api/cloud?date=YYYY-MM-DD`**
- Default `date` = hôm nay (server timezone)
- Return: `{ date, words: [{ phrase, count }] }` — sorted by count desc, max 50 phrases

**`GET /api/cloud/ws`** (WebSocket upgrade)
- Client kết nối → nhận `{ type: "cloud-update", data: words[] }` mỗi khi có entry mới

### Protected (JWT required)

**`POST /api/admin/login`**
- Body: `{ username, password }`
- Verify Argon2id hash → return JWT (issuer/audience từ env)

**`GET /api/admin/entries/list`** (createBaseController)
- Query: `page`, `pageSize`, `date`, `keyword`
- Return: entries + cluster count per entry, sorted by `logCreatedDate` desc

**`DELETE /api/admin/entries/delete`** (createBaseController)
- Soft-delete entry + cascade clusters

---

## 5. Frontend Pages & Components

### EmployeeHome
- `<ModelViewer mascot={activeMascot}>` — `@google/model-viewer`, auto-rotate
- `<MoodInput>` — textarea max 500 chars, live counter, Submit button
- `<WordCloud words={words}>` — `<span>` sized 16–48px theo count, màu từ theme tokens
- Date navigation (← ngày trước / hôm nay →)
- `useCloudSocket()` hook — WebSocket → merge words vào state khi nhận update

### MascotPicker
- Overlay lần đầu (hoặc click icon header)
- 4 thẻ: `<model-viewer>` 100×120 + tên + màu theme
- Chọn → `localStorage.setItem("moodaily-mascot", key)` + `document.documentElement.dataset.theme = key`

### AdminLogin
- Form username/password → POST `/api/admin/login` → store JWT → redirect `/admin/dashboard`

### AdminDashboard
- `<StatCard>` × 3: Hôm nay / Tuần / Tháng (query count từ API)
- Date filter chips + search input
- `<EntryTable>`: time | rawText (truncated 80 chars) | cluster count chip | Xóa
- `<ConfirmDialog>` trước khi xóa
- Pagination: pageSize = 20

### Routing (React Router v6)
```
/                 → EmployeeHome
/admin            → AdminLogin (redirect /admin/dashboard nếu có JWT)
/admin/dashboard  → AdminDashboard (redirect /admin nếu không có JWT)
```

---

## 6. Environment Variables

File: `packages/api/.env` (không commit — thêm vào `.gitignore`)

```env
DATABASE_URL="postgresql://postgres:***@42.119.236.229:5432/moodaily"
JWT_SECRET="<generated-64-char>"
JWT_ISSUER="moodaily"
JWT_AUDIENCE="moodaily-client"
PORT=3000

# AI Provider — chọn "openai" hoặc "gemini"
AI_PROVIDER="gemini"
OPENAI_API_KEY=""        # dùng khi AI_PROVIDER=openai  (sk-...)
GEMINI_API_KEY=""        # dùng khi AI_PROVIDER=gemini  (AIzaSy...)
```

Validate khi startup bằng Zod schema (LA-11). Fail-fast nếu thiếu `DATABASE_URL`, `JWT_SECRET`, `AI_PROVIDER`. Key tương ứng (`OPENAI_API_KEY` hoặc `GEMINI_API_KEY`) validate theo giá trị `AI_PROVIDER`.

**AI provider abstraction** (`src/api/plugins/ai-provider.ts`):
```ts
interface AiProvider {
  extractClusters(text: string): Promise<string[]>
}
// factory: AI_PROVIDER=openai → OpenAiProvider (sdk: openai)
//          AI_PROVIDER=gemini → GeminiProvider (sdk: @google/generative-ai)
export function createAiProvider(): AiProvider { ... }
```
Cùng prompt, cùng output contract (`string[]`). Đổi provider = đổi 1 env var, không sửa code.

---

## 7. Error Handling

| Tình huống | Xử lý |
|---|---|
| OpenAI timeout / lỗi | Lưu entry với `clusters = []`, return 201, log lỗi |
| rawText rỗng / quá 500 chars | 400 VALIDATION |
| WS client disconnect | `wsHub` tự remove khi `close` event |
| DB connection fail | Fastify startup crash (fail-fast) |
| Admin JWT hết hạn | 401 → FE redirect `/admin` |

---

## 8. ScreenCodes & Permissions

```ts
// src/core/screen-codes.ts
export const ScreenCodes = {
  MDY_ENTRY:   'MDY_ENTRY',    // MoodEntry CRUD (admin)
  MDY_CLUSTER: 'MDY_CLUSTER',  // MoodCluster (internal, cascade only)
} as const;
```

**Simplified permission model** (single-admin app): `PermissionCache` loader trả full access cho mọi roleId hợp lệ — không cần `Role`/`RolePermission` table riêng:

```ts
// src/infrastructure/permission-cache.ts
export const permissionCache = new PermissionCache(async (_roleId) => [
  'MDY_ENTRY:VIEW', 'MDY_ENTRY:ADD',
  'MDY_ENTRY:UPDATE', 'MDY_ENTRY:DELETE',
  'MDY_CLUSTER:VIEW', 'MDY_CLUSTER:DELETE',
]);
```

JWT `callerRoles` = `["admin"]` (hardcoded khi login). Bất kỳ JWT hợp lệ nào đều có full access.

**Admin user seeding**: thêm `POST /api/admin/seed` (chỉ chạy khi `ADMIN_SEED_TOKEN` env khớp) — tạo user admin lần đầu. Hoặc Prisma seed script (`prisma/seed.ts`).

---

## 9. VegaBase Consumer Rules áp dụng

- **LA-07**: Layout 3-tầng `core/` · `service/` · `api/` · `infrastructure/`
- **LA-09**: Plugin registration order cố định (public routes trước JWT)
- **LA-11/12**: Env validation + startup sequence — fail-fast nếu thiếu `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`
- **DB-08–DB-11**: Prisma model với đủ BaseEntity fields, `id String @id` không `@default`
- **BC-11–BC-15**: BaseService + createBaseController cho `MoodEntry` (admin CRUD)
- **BC-16**: Custom public routes (`/mood/submit`, `/cloud`) wrap response trong `successResponse(data, traceId)`
- **BC-17**: `MoodEntryService` nhận `prisma.moodEntry` delegate; cần `prisma: PrismaClient` riêng cho cascade softDelete qua `executor.softDeleteAsync` nhiều record
- **EH**: Service không throw — return `Result.fail([...])` cho lỗi business
