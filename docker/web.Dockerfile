# syntax=docker/dockerfile:1

FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /app


# ----------------------------
# Install dependencies
# ----------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter web...


# ----------------------------
# Build Next.js
# ----------------------------
FROM base AS builder

COPY --from=deps /app/ ./
COPY . .

RUN pnpm --filter web build


# ----------------------------
# Production image
# ----------------------------
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/.next/static ./apps/web/.next/static

COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/public ./apps/web/public


    # Work around Next 16.3.1 standalone/pnpm SWC helper tracing issue.
RUN set -eux; \
    mkdir -p /app/node_modules/.pnpm/node_modules/@swc; \
    rm -rf /app/node_modules/.pnpm/node_modules/@swc/helpers; \
    cp -R /app/apps/web/node_modules/@swc/helpers \
        /app/node_modules/.pnpm/node_modules/@swc/helpers; \
    for swc_dir in /app/node_modules/.pnpm/next@*/node_modules/@swc; do \
        if [ -d "$swc_dir" ]; then \
            rm -rf "$swc_dir/helpers"; \
            cp -R /app/apps/web/node_modules/@swc/helpers "$swc_dir/helpers"; \
        fi; \
    done  

USER nextjs

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["node", "server.js"]
