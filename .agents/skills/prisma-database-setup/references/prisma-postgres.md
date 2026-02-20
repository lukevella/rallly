# Prisma Postgres Setup

Configure Prisma with Prisma Postgres (Managed).

## Overview

Prisma Postgres is a serverless, managed PostgreSQL database optimized for Prisma.

## Setup via CLI

You can provision a Prisma Postgres instance directly via the CLI:

```bash
prisma init --db
```

This will:
1. Log you into Prisma Data Platform.
2. Create a new project and database instance.
3. Update your `.env` with the connection string.

## Connection String

The connection string starts with `prisma+postgres://`.

```env
DATABASE_URL="prisma+postgres://api_key@host.prisma-data.net/env_id"
```

## 1. Schema Configuration

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql" // Use postgresql provider
}

generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```

## 2. Config Configuration

In `prisma.config.ts`:

```typescript
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

## Driver Adapter (Prisma ORM 7 required)

Prisma ORM 7 uses the query compiler by default, so you must use a driver adapter. For Prisma Postgres, use the Prisma Postgres serverless driver adapter.

1. Install adapter and driver:
   ```bash
   npm install @prisma/adapter-ppg @prisma/ppg
   ```

2. Use a **direct TCP** connection string for the adapter (from the Prisma Console) and instantiate Prisma Client:
   ```typescript
   import 'dotenv/config'
   import { PrismaClient } from '../generated/client'
   import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

   const prisma = new PrismaClient({
     adapter: new PrismaPostgresAdapter({
       connectionString: process.env.PRISMA_DIRECT_TCP_URL,
     }),
   })
   ```

## Features

- **Serverless**: Scales to zero.
- **Caching**: Integrated query caching (Accelerate).
- **Real-time**: Database events (Pulse).

## Using with Prisma Client

Since Prisma ORM 7 requires a driver adapter, use the Prisma Postgres adapter shown above when instantiating Prisma Client.
