# Base stage with Node.js 20 and Corepack enabled
FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Slim base stage with Node.js 20 and Corepack enabled
FROM node:20-slim AS base-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY package.json .
RUN pnpm add -g turbo
COPY . .
RUN turbo prune --scope=@rallly/web --docker

# --- Installer Stage ---
FROM base AS installer
WORKDIR /app
COPY package.json .
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm db:generate

ARG APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION

ARG SELF_HOSTED
ENV NEXT_PUBLIC_SELF_HOSTED=$SELF_HOSTED

RUN SKIP_ENV_VALIDATION=1 pnpm build

# --- Runner Stage ---
FROM base-slim AS runner

# Disable Next.js telemetry for self-hosted instances
ENV NEXT_TELEMETRY_DISABLED=1

# Install required system packages for Prisma
# (see https://www.prisma.io/docs/orm/reference/system-requirements)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    zlib1g \
    libgcc-s1 \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install prisma globally needed for runtime operations like migrations
RUN pnpm add -g prisma

# Don't run production as root
RUN addgroup --system nodejs \
  && adduser --system --ingroup nodejs --home /app --shell /bin/bash nextjs

# Copy Corepack cache from installer stage to avoid runtime download
COPY --from=installer /root/.cache/node/corepack/ /app/.cache/node/corepack/

# Copy app files
COPY --from=builder /app/scripts/docker-start.sh ./
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .

# Copy Next.js standalone output
COPY --chown=nextjs:nodejs --from=installer /app/apps/web/.next/standalone ./
COPY --chown=nextjs:nodejs --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --chown=nextjs:nodejs --from=installer /app/apps/web/public ./apps/web/public

# Fix ownership of global pnpm dir - Prisma needs write access to its engines
# and cache directories within the pnpm global store at runtime
RUN chown -R nextjs:nodejs /pnpm
ENV HOME=/app
USER nextjs

EXPOSE 3000
ENV PORT=3000

ARG SELF_HOSTED
ENV NEXT_PUBLIC_SELF_HOSTED=$SELF_HOSTED
ENV HOSTNAME=0.0.0.0

HEALTHCHECK CMD curl --fail http://localhost:${PORT}/api/status || exit 1

CMD ["./docker-start.sh"]
