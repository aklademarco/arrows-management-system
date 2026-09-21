# syntax=docker/dockerfile:1

FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api...

FROM dependencies AS builder

COPY . .

RUN pnpm --filter api build

FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter api...

FROM node:22-slim AS runner

ENV NODE_ENV=production
ENV API_PORT=4000

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=builder --chown=node:node /app/apps/api/scripts ./apps/api/scripts
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json

USER node
WORKDIR /app/apps/api

EXPOSE 4000

CMD ["sh", "-c", "node scripts/migrate.cjs && node dist/main.js"]
