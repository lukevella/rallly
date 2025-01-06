#!/bin/sh
set -e

export DIRECT_DATABASE_URL=$DATABASE_URL
export NEXTAUTH_URL=$NEXT_PUBLIC_BASE_URL

prisma migrate deploy --schema=./prisma/schema.prisma
node apps/web/server.js
