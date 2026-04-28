FROM node:20-slim

ARG VEGABASE_REPO=https://github.com/hungngominh/vegabase-node.git

# Build tools needed for native modules (argon2) and git clone
RUN apt-get update && apt-get install -y --no-install-recommends \
    git openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.0.0

# Clone vegabase-node to the path resolved by pnpm workspace links:
#   /app/packages/api  ->  ../../../../Work/vegabase-node  =  /Work/vegabase-node
RUN git clone ${VEGABASE_REPO} /Work/vegabase-node

WORKDIR /Work/vegabase-node
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi
RUN pnpm build 2>/dev/null || echo "vegabase: no build script, skipping"

# ── Install app dependencies ───────────────────────────────────────────────
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile

# ── Copy source & build ────────────────────────────────────────────────────
COPY . .

# Ensure mascot dir exists — build script uses cpSync which throws on missing src
RUN mkdir -p mascot

# Generate Prisma client for target platform
RUN pnpm --filter @moodaily/api exec prisma generate

# 1) tsc compiles API  2) vite builds web → packages/api/public  3) copies mascot
RUN pnpm build

# ── Runtime ───────────────────────────────────────────────────────────────
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/cloud',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "packages/api/dist/index.js"]
