#!/bin/sh
set -e

export DIRECT_DATABASE_URL=$DATABASE_URL
npx prisma migrate deploy --config=./prisma.config.ts
node apps/web/server.js
