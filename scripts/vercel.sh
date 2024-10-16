#!/bin/sh
set -e
pnpm db:generate
pnpm build
# Deploy migration using direct database connection (no connection pool)
DATABASE_URL=$DIRECT_DATABASE_URL pnpm db:deploy
