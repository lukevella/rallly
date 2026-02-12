#!/bin/sh
set -e

# Needed by next-auth to verify the origin of the request
export AUTH_URL=$NEXT_PUBLIC_BASE_URL

npx prisma migrate deploy --config=./prisma.config.ts
node apps/web/server.js
