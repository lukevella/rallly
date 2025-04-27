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
COPY .gitignore .gitignore
COPY package.json .
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

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

COPY package.json .
# Install prisma globally needed for runtime operations like migrations
RUN pnpm add -g prisma

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./prisma
COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .

ENV PORT=3000
EXPOSE 3000

# Copy Next.js standalone output
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

ARG SELF_HOSTED
ENV NEXT_PUBLIC_SELF_HOSTED=$SELF_HOSTED
ENV HOSTNAME=0.0.0.0

HEALTHCHECK CMD curl --fail http://localhost:${PORT}/api/status || exit 1

CMD ["./docker-start.sh"]
