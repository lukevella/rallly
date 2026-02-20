---
name: prisma-upgrade-v7
description: Complete migration guide from Prisma ORM v6 to v7 covering all breaking changes. Use when upgrading Prisma versions, encountering v7 errors, or migrating existing projects. Triggers on "upgrade to prisma 7", "prisma 7 migration", "prisma-client generator", "driver adapter required".
license: MIT
metadata:
  author: prisma
  version: "7.0.0"
---

# Upgrade to Prisma ORM 7

Complete guide for migrating from Prisma ORM v6 to v7. This upgrade introduces significant breaking changes including ESM-only support, required driver adapters, and a new configuration system.

## When to Apply

Reference this skill when:
- Upgrading from Prisma v6 to v7
- Updating to the `prisma-client` generator
- Setting up driver adapters
- Configuring `prisma.config.ts`
- Fixing import errors after upgrade

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Schema Migration | CRITICAL | `schema-changes` |
| 2 | Database Connectivity | CRITICAL | `driver-adapters` |
| 3 | Module System | CRITICAL | `esm-support` |
| 4 | Config and Env | HIGH | `prisma-config`, `env-variables` |
| 5 | Removed Features | HIGH | `removed-features` |
| 6 | Accelerate | HIGH | `accelerate-users` |

## Quick Reference

- `schema-changes` - generator and output migration for Prisma v7
- `driver-adapters` - required adapter installation and client wiring
- `esm-support` - package/module requirements for ESM
- `prisma-config` - creating and using `prisma.config.ts`
- `env-variables` - explicit environment loading
- `removed-features` - removed middleware, metrics, and flags
- `accelerate-users` - migration notes for Accelerate users

## Important Notes

- **MongoDB not yet supported in v7** - Continue using v6 for MongoDB
- **Node.js 20.19.0+** required
- **TypeScript 5.4.0+** required

## Upgrade Steps Overview

1. Update packages to v7
2. Configure ESM in package.json
3. Update TypeScript configuration
4. Update schema generator block
5. Create prisma.config.ts
6. Install and configure driver adapter
7. Update Prisma Client imports
8. Update client instantiation
9. Remove deprecated code (middleware, env vars)
10. Run generate and test

## Quick Upgrade Commands

```bash
# Update packages
npm install @prisma/client@7
npm install -D prisma@7

# Install driver adapter (PostgreSQL example)
npm install @prisma/adapter-pg

# Install dotenv for env loading
npm install dotenv

# Regenerate client
npx prisma generate
```

## Breaking Changes Summary

| Change | v6 | v7 |
|--------|----|----|
| Module format | CommonJS | ESM only |
| Generator provider | `prisma-client-js` | `prisma-client` |
| Output path | Auto (node_modules) | Required explicit |
| Driver adapters | Optional | Required |
| Config file | `.env` + schema | `prisma.config.ts` |
| Env loading | Automatic | Manual (dotenv) |
| Middleware | `$use()` | Client Extensions |
| Metrics | Preview feature | Removed |

## Rule Files

Detailed migration guides for each breaking change:

```
references/esm-support.md        - ESM module configuration
references/schema-changes.md     - Generator and schema updates
references/driver-adapters.md    - Required driver adapter setup
references/prisma-config.md      - New configuration file
references/env-variables.md      - Environment variable loading
references/removed-features.md   - Middleware, metrics, and CLI flags
references/accelerate-users.md   - Special handling for Accelerate
```

## Step-by-Step Migration

### 1. Update package.json for ESM

```json
{
  "type": "module"
}
```

### 2. Update tsconfig.json

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### 3. Update schema.prisma

```prisma
// Before (v6)
generator client {
  provider = "prisma-client-js"
}

// After (v7)
generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```

### 4. Create prisma.config.ts

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### 5. Install driver adapter

```bash
# PostgreSQL
npm install @prisma/adapter-pg

# MySQL
npm install @prisma/adapter-mariadb mariadb

# SQLite
npm install @prisma/adapter-better-sqlite3

# Prisma Postgres
npm install @prisma/adapter-ppg @prisma/ppg

# Neon
npm install @prisma/adapter-neon
```

### 6. Update client instantiation

```typescript
// Before (v6)
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// After (v7)
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })
```

### 7. Run migrations and generate

```bash
npx prisma generate
npx prisma migrate dev  # if needed
```

## Troubleshooting

### "Cannot find module" errors
- Check `output` path in generator block matches import path
- Ensure `prisma generate` ran successfully

### SSL certificate errors
- Add `ssl: { rejectUnauthorized: false }` to adapter config
- Or properly configure SSL certificates

### Connection timeout issues
- Driver adapters use different pool defaults
- Configure pool settings explicitly on the adapter

## Resources

- [Official v7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Driver Adapters Documentation](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)

## How to Use

Follow `references/schema-changes.md` and `references/driver-adapters.md` first, then apply the remaining reference files based on your project setup.
