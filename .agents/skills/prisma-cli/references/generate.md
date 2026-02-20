# prisma generate

Generates assets based on the generator blocks in your Prisma schema, most commonly Prisma Client.

## Command

```bash
prisma generate [options]
```

## Bun Runtime

If you're using Bun, run Prisma with `bunx --bun` so it doesn't fall back to Node.js:

```bash
bunx --bun prisma generate
```

## What It Does

1. Reads your `schema.prisma` file
2. Generates a customized Prisma Client based on your models
3. Outputs to the directory specified in the generator block

## Options

| Option | Description |
|--------|-------------|
| `--schema` | Custom path to your Prisma schema |
| `--config` | Custom path to your Prisma config file |
| `--sql` | Generate typed sql module |
| `--watch` | Watch the Prisma schema and rerun after a change |
| `--generator` | Generator to use (may be provided multiple times) |
| `--no-hints` | Hides the hint messages but still outputs errors and warnings |
| `--require-models` | Do not allow generating a client without models |

## Examples

### Basic generation

```bash
prisma generate
```

### Watch mode (development)

```bash
prisma generate --watch
```

Auto-regenerates when `schema.prisma` changes.

### Specific generator

```bash
prisma generate --generator client
```

### Multiple generators

```bash
prisma generate --generator client --generator zod_schemas
```

### Typed SQL generation

```bash
prisma generate --sql
```

## Schema Configuration (v7)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```

### Key v7 Changes

- Provider must be `prisma-client`
- `output` is now **required** - client no longer generates to `node_modules`
- Update imports after generating:

```typescript
// Before (v6)
import { PrismaClient } from '@prisma/client'

// After (v7)
import { PrismaClient } from '../generated/client'
```

## Common Patterns

### After schema changes

```bash
prisma migrate dev --name my_migration
prisma generate
```

Note: In v7, `migrate dev` no longer auto-runs `generate`.

### CI/CD pipeline

```bash
prisma generate
```

Run before building your application.

### Multiple generators

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated"
}

generator zod {
  provider = "zod-prisma-types"
  output   = "../generated/zod"
}
```

```bash
prisma generate  # Runs all generators
```

## Output Structure

After running `prisma generate`, your output directory contains:

```
generated/
├── client.ts
├── models/
├── enums.ts
└── ...
```

Import the client:

```typescript
import { PrismaClient, Prisma } from '../generated/client'
```
