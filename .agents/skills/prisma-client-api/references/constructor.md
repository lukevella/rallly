# PrismaClient Constructor

Configure Prisma Client when instantiating.

## Basic Instantiation (v7)

```typescript
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter })
```

## Constructor Options

### adapter (Required in v7)

Driver adapter instance:

```typescript
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter })
```

### accelerateUrl (For Accelerate users)

```typescript
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,  // prisma:// URL
}).$extends(withAccelerate())
```

### log

Configure logging:

```typescript
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
})
```

#### Log levels

| Level | Description |
|-------|-------------|
| `query` | All SQL queries |
| `info` | Informational messages |
| `warn` | Warnings |
| `error` | Errors |

#### Log to events

```typescript
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query:', e.query)
  console.log('Duration:', e.duration, 'ms')
})
```

### errorFormat

Control error formatting:

```typescript
const prisma = new PrismaClient({
  adapter,
  errorFormat: 'pretty',  // 'pretty' | 'colorless' | 'minimal'
})
```

### transactionOptions

Default transaction settings:

```typescript
const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 5000,      // Max wait to acquire transaction (ms)
    timeout: 10000,     // Max transaction duration (ms)
    isolationLevel: 'Serializable',
  },
})
```

## Singleton Pattern

Prevent multiple client instances in development:

```typescript
// lib/prisma.ts
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Next.js Pattern

```typescript
// lib/prisma.ts
import { PrismaClient } from '@/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const createAdapter = () => new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter: createAdapter() })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
```

## Query Events

Listen to query events:

```typescript
const prisma = new PrismaClient({
  adapter,
  log: [{ level: 'query', emit: 'event' }],
})

prisma.$on('query', (e) => {
  console.log('Query:', e.query)
  console.log('Params:', e.params)
  console.log('Duration:', e.duration)
})
```

## Log Events

```typescript
prisma.$on('info', (e) => console.log(e.message))
prisma.$on('warn', (e) => console.warn(e.message))
prisma.$on('error', (e) => console.error(e.message))
```
