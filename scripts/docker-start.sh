#!/bin/sh
set -e
yarn prisma migrate deploy --schema prisma/schema.prisma
yarn start
