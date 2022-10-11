#!/bin/sh
yarn prisma migrate deploy --schema prisma/schema.prisma
yarn start
