#!/bin/sh
set -e
export NEXT_PUBLIC_APP_VERSION=v$(node -p "require('./package.json').version")
echo "Set NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION"
yarn prisma generate
yarn build
# Deploy migration using direct database connection (no connection pool)
DATABASE_URL=$DIRECT_DATABASE_URL yarn db:deploy
