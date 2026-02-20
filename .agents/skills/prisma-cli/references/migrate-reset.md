# prisma migrate reset

Resets your database and re-applies all migrations.

## Command

```bash
prisma migrate reset [options]
```

## What It Does

1. **Drops** the database (if possible) or deletes all data/tables
2. **Re-creates** the database
3. **Applies** all migrations from `prisma/migrations/`
4. **Runs** the seed script (if configured)

**Warning: All data will be lost.**

## Options

| Option | Description |
|--------|-------------|
| `--force` / `-f` | Skip confirmation prompt |
| `--schema` | Path to schema file |
| `--config` | Custom path to your Prisma config file |

## Examples

### Basic reset

```bash
prisma migrate reset
```

Prompts for confirmation in interactive terminals.

### Force reset (CI/Automation)

```bash
prisma migrate reset --force
```

### With custom schema

```bash
prisma migrate reset --schema=./custom/schema.prisma
```

## When to Use

- **Development**: When you want a fresh start
- **Testing**: Resetting test database before suites
- **Drift Recovery**: When the database is out of sync and you can't migrate

## Behavior in v7

- In v6, `migrate reset` automatically ran `prisma generate`.
- In v7, you may need to run `prisma generate` separately if you want to update the client, though `reset` focuses on the database state.
- Seed script IS run by default after reset.

## Configuration

Configure seed script in `prisma.config.ts` to run it automatically after reset:

```typescript
export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
```
