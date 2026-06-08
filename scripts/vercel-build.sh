#!/usr/bin/env bash
# Vercel build entrypoint.
#
# Applies any pending Prisma migrations to the target database (when a
# DATABASE_URL is available) before building the web app. Without this, a
# freshly provisioned production database has no schema, so every request
# fails at runtime with a PrismaClientKnownRequestError (HTTP 500) even
# though the build succeeds.
#
# `prisma migrate deploy` is idempotent — it only applies migrations that
# have not run yet — so this is safe to execute on every deploy. The guard
# skips migrations on deploys with no DATABASE_URL (e.g. previews that are
# not wired to a database) instead of failing the build.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "▸ Applying database migrations (prisma migrate deploy)…"
  pnpm db:deploy
else
  echo "▸ DATABASE_URL not set — skipping migrations."
fi

echo "▸ Building web app…"
pnpm build:web
