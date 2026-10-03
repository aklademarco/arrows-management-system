# syntax=docker/dockerfile:1

FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.15.1 --activate

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

# Next 16.3.1 standalone + pnpm workaround:
# dereference the @swc/helpers symlink into a real directory
# that can safely be copied into the runner image.
RUN set -eux; \
    rm -rf /tmp/swc-helpers; \
    cp -rL /app/apps/web/node_modules/@swc/helpers /tmp/swc-helpers; \
    test -f /tmp/swc-helpers/package.json


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


# Copy Next standalone output
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/.next/standalone ./


# Copy Next static files
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/.next/static ./apps/web/.next/static


# Copy public assets
COPY --from=builder --chown=nextjs:nodejs \
    /app/apps/web/public ./apps/web/public


# Copy the complete SWC helpers package prepared in the builder stage
COPY --from=builder \
    /tmp/swc-helpers /tmp/swc-helpers


# Work around Next 16.3.1 standalone/pnpm SWC helper tracing issue.
#
# Next may try to resolve @swc/helpers from:
#
# /app/node_modules/.pnpm/node_modules/@swc/helpers
#
# as well as from inside Next's pnpm package directory.
RUN set -eux; \
    mkdir -p /app/node_modules/.pnpm/node_modules/@swc; \
    rm -rf /app/node_modules/.pnpm/node_modules/@swc/helpers; \
    cp -rL \
      /tmp/swc-helpers \
      /app/node_modules/.pnpm/node_modules/@swc/helpers; \
    find /app/node_modules/.pnpm \
      -type d \
      -path '*/next@*/node_modules/@swc' \
      -print \
      | while read -r swc_dir; do \
          rm -rf "$swc_dir/helpers"; \
          cp -rL /tmp/swc-helpers "$swc_dir/helpers"; \
        done; \
    test -f \
      /app/node_modules/.pnpm/node_modules/@swc/helpers/esm/_interop_require_default.js; \
    rm -rf /tmp/swc-helpers


USER nextjs

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["node", "server.js"]