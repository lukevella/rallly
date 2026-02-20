# ESM Support

Prisma ORM v7 ships as an ES module only. Your project must be configured for ESM.

## Required Changes

### package.json

Add the `type` field:

```json
{
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### tsconfig.json

Configure for ESM:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

### Alternative: Node16/NodeNext

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "target": "ES2022"
  }
}
```

## Import Syntax Changes

### Named imports

```typescript
// ESM (v7)
import { PrismaClient } from '../generated/client'

// Not: require()
```

### File extensions

With `moduleResolution: "Node16"`, add `.js` extensions:

```typescript
import { helper } from './utils/helper.js'
```

With `moduleResolution: "bundler"`, extensions are optional.

## Minimum Versions

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 20.19.0 |
| TypeScript | 5.4.0 |

## CommonJS Compatibility

If you must use CommonJS:

### Dynamic import

```javascript
// CommonJS file
async function main() {
  const { PrismaClient } = await import('../generated/client.js')
  const prisma = new PrismaClient()
}
```

### Separate ESM file

Create an ESM wrapper:

```javascript
// prisma.mjs
import { PrismaClient } from '../generated/client'
export const prisma = new PrismaClient()
```

## Framework Considerations

### Next.js

Next.js supports ESM. Ensure `next.config.js` → `next.config.mjs`:

```javascript
// next.config.mjs
export default {
  // config
}
```

### Express

Update entry point:

```javascript
// index.js (with "type": "module")
import express from 'express'
import { PrismaClient } from '../generated/client'

const app = express()
const prisma = new PrismaClient()
```

### Jest

Configure Jest for ESM:

```json
{
  "jest": {
    "preset": "ts-jest/presets/default-esm",
    "extensionsToTreatAsEsm": [".ts"],
    "transform": {
      "^.+\\.tsx?$": ["ts-jest", { "useESM": true }]
    }
  }
}
```

Or use Vitest which has native ESM support.

## Troubleshooting

### "ERR_REQUIRE_ESM"

Your code is using `require()` on an ESM module. Switch to `import`.

### "Cannot use import statement outside a module"

Add `"type": "module"` to package.json.

### TypeScript compilation errors

Ensure `module` and `moduleResolution` are set correctly in tsconfig.json.
