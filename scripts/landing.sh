#!/bin/sh
set -e
pnpm prisma generate
pnpm build