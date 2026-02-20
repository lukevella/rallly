# MySQL Setup

Configure Prisma with MySQL (or MariaDB).

## Prerequisites

- MySQL or MariaDB database
- Connection string

## 1. Schema Configuration

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```

## 2. Config Configuration (v7)

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

## 3. Environment Variable

In `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

### Connection String Format

```
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

- **USER**: Database user
- **PASSWORD**: Password
- **HOST**: Hostname
- **PORT**: Port (default 3306)
- **DATABASE**: Database name

## Driver Adapter (Prisma ORM 7 required)

Prisma ORM 7 uses the query compiler by default, so you must use a driver adapter.

1. Install adapter and driver:
   ```bash
   npm install @prisma/adapter-mariadb mariadb
   ```

2. Instantiate Prisma Client with the adapter:
   ```typescript
   import 'dotenv/config'
   import { PrismaClient } from '../generated/client'
   import { PrismaMariaDb } from '@prisma/adapter-mariadb'

   const adapter = new PrismaMariaDb({
     host: 'localhost',
     port: 3306,
     connectionLimit: 5,
     user: process.env.MYSQL_USER,
     password: process.env.MYSQL_PASSWORD,
     database: process.env.MYSQL_DATABASE,
   })

   const prisma = new PrismaClient({ adapter })
   ```

## PlanetScale Setup

PlanetScale uses MySQL but requires specific settings because it doesn't support foreign key constraints.

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider     = "mysql"
  relationMode = "prisma" // Emulate foreign keys in Prisma
}
```

## Common Issues

### "Too many connections"
MySQL has a connection limit. Adjust connection pool size in URL:
```env
DATABASE_URL="mysql://...?connection_limit=5"
```

### JSON Support
MySQL 5.7+ supports JSON. MariaDB 10.2+ supports JSON (as an alias for LONGTEXT with check constraints). Prisma handles this, but verify your version.
