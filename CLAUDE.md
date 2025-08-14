# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rallly is a meeting scheduling application built with Next.js that allows users to create polls to find the best meeting times. It supports both self-hosted and cloud-hosted deployments with a freemium model.

**Core Technologies:**
- Next.js 15 with React 19
- tRPC for API layer
- Prisma with PostgreSQL
- NextAuth.js for authentication  
- TailwindCSS for styling
- TypeScript throughout

## Development Commands

### Getting Started
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.development .env

# Generate Prisma client
pnpm db:generate

# Start development database
pnpm docker:up

# Reset/setup database with seed data
pnpm db:reset

# Start development server
pnpm dev
```

### Common Commands
```bash
# Development
pnpm dev                    # Start web app dev server
pnpm dev:landing           # Start landing page dev server  
pnpm dev:emails            # Start email template dev server

# Building
pnpm build                 # Build web app
pnpm build:web            # Build web app with version injection
pnpm build:landing        # Build landing page
pnpm build:test           # Build for testing

# Database
pnpm db:migrate           # Run database migrations
pnpm db:push              # Push schema changes
pnpm db:deploy            # Deploy migrations (production)

# Testing
pnpm test:unit            # Run unit tests (Vitest)
pnpm test:integration     # Run integration tests (Playwright)

# Code Quality
pnpm check                # Run Biome linter/formatter
pnpm check:fix            # Auto-fix linting issues
pnpm type-check           # Run TypeScript type checking

# Utilities
pnpm i18n:scan            # Scan for translation keys
pnpm sherif               # Check package dependencies
```

## Architecture

### Monorepo Structure
- `apps/web/` - Main Next.js application
- `apps/landing/` - Marketing/landing page
- `apps/docs/` - Documentation site
- `packages/` - Shared packages:
  - `database/` - Prisma schema and client
  - `ui/` - Shared UI components
  - `emails/` - Email templates
  - `posthog/` - Analytics client
  - `billing/` - Stripe integration
  - `utils/` - Shared utilities

### Key Features & Structure
- **Polls**: Core scheduling functionality in `apps/web/src/components/poll/`
- **Spaces**: Workspace/team organization in `apps/web/src/features/space/`
- **Authentication**: NextAuth.js setup in `apps/web/src/auth/`
- **tRPC API**: Routers in `apps/web/src/trpc/routers/`
- **Feature Flags**: Quick create and other toggles in `apps/web/src/lib/feature-flags/`

### Database
- PostgreSQL with Prisma ORM
- Multi-model schema split across files in `packages/database/prisma/models/`
- Supports both cloud (Vercel KV) and self-hosted Redis for rate limiting

### Authentication & Authorization
- NextAuth.js with multiple providers (Google, Microsoft, OIDC, Guest)
- CASL-based permissions system for spaces and polls
- User roles: admin, member with tier-based abilities (free/pro)

### Deployment Modes
- **Cloud Hosted**: Full SaaS with Stripe billing on Vercel
- **Self Hosted**: Docker-based deployment without billing features
- Environment variable `NEXT_PUBLIC_SELF_HOSTED=true` toggles features

## Testing

### Integration Tests (Playwright)
- Located in `apps/web/tests/`
- Use `pnpm test:integration` to run
- Test utilities in `apps/web/tests/test-utils.ts`
- Mailpit integration for email testing

### Unit Tests (Vitest)
- Use `pnpm test:unit` to run
- Test files co-located with source code

## Code Standards

### Styling
- TailwindCSS with custom design system
- Biome for code formatting (indent: 2 spaces, double quotes)
- Custom UI components in `packages/ui/src/`

### State Management
- tRPC with TanStack Query for server state
- React Context for client state (auth, preferences, etc.)
- Form state with react-hook-form + Zod validation

### TypeScript Conventions
- Prefer inline prop types over named interfaces for simple component props
- Example: `function Component({ prop }: { prop: string })` instead of defining a separate interface
- Only create named interfaces when they're reused or complex

### Dialog Management
- **IMPORTANT**: Always use the `useDialog` hook from `@rallly/ui/dialog` for managing dialog state instead of manual `useState` for open/close state
- The hook provides `dialog.trigger()`, `dialog.dismiss()`, and `dialog.dialogProps` which should be spread onto the dialog component
- Example usage:
  ```tsx
  const dialog = useDialog();
  
  // Trigger dialog
  <Button onClick={() => dialog.trigger()}>Open</Button>
  
  // Dialog component
  <MyDialog {...dialog.dialogProps} />
  ```

### File Organization
- Features organized in `apps/web/src/features/[feature]/`
- Shared components in `apps/web/src/components/`
- Route handlers follow Next.js App Router conventions

## Environment Variables

Key variables for development:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_PASSWORD` - NextAuth secret
- `GOOGLE_CLIENT_ID/SECRET` - OAuth provider
- `NEXT_PUBLIC_SELF_HOSTED` - Deployment mode toggle
- `KV_REST_API_URL` - Redis for rate limiting (optional)

See `.env.development` for complete development defaults.

## i18n & Localization

- i18next for internationalization
- Translation files in `public/locales/[lang]/`
- Crowdin integration for translation management
- Use `pnpm i18n:scan` to extract new translation keys
- **IMPORTANT**: When TypeScript errors occur for missing i18n keys, run `pnpm i18n:scan` instead of manually adding keys. This command automatically scans the codebase for `Trans` components and generates the necessary translation entries.
- **Pluralization**: Always use ICU message format for plurals. Example: `{count, plural, =0 {No items} one {1 item} other {# items}}` instead of separate singular/plural translation keys.