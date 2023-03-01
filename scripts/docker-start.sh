#!/bin/sh
set -e
prisma migrate deploy --schema=./prisma/schema.prisma
node apps/web/server.js
