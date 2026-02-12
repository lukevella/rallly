#!/bin/sh
set -e

npx prisma migrate deploy --config=./prisma.config.ts
node apps/web/server.js
