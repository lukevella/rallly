#!/bin/sh
set -e

export DIRECT_DATABASE_URL=$DATABASE_URL

prisma migrate deploy --schema=./prisma/schema.prisma
node apps/web/server.js
