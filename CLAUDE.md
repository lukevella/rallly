# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rallly is a meeting scheduling application built with Next.js that allows users to create polls to find the best meeting times. It supports both self-hosted and cloud-hosted deployments with a freemium model.

**Core Technologies:**
- Next.js 16 with React 19
- tRPC for API layer
- Prisma with PostgreSQL
- Better-Auth for authentication
- TailwindCSS for styling
- TypeScript throughout
- dayjs for date handling

## Development Commands

### Getting Started
```bash
# Install dependencies
pnpm install

# Setup environment
cp apps/web/.env.sample apps/web/.env
cp packages/database/.env.sample packages/database/.env

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
- **Polls**: Core scheduling functionality in `apps/web/src/features/poll/`
- **Spaces**: Workspace/team organization in `apps/web/src/features/space/`
- **Authentication**: Better-Auth config in `apps/web/src/lib/auth.ts`, domain logic in `apps/web/src/features/auth/`
- **tRPC API**: Routers in `apps/web/src/trpc/routers/`
- **Feature Flags**: Quick create and other toggles in `apps/web/src/lib/feature-flags/`

### Database
- PostgreSQL with Prisma ORM
- Multi-model schema split across files in `packages/database/prisma/models/`
- Supports both cloud (Vercel KV) and self-hosted Redis for rate limiting

### Authentication & Authorization
- Better-Auth with multiple providers (Google, Microsoft, OIDC, email OTP, guest)
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

## Git Commits
Always use gitmoji prefixes in commit messages. Follow the gitmoji convention (https://gitmoji.dev) for the type of change (e.g. `📝` docs, `♻️` refactor, `🐛` fix, `✨` feature).

## Code Standards

### Styling
- TailwindCSS with custom design system
- Use `cn()` from `@rallly/ui` to compose classes
- Biome for code formatting (indent: 2 spaces, double quotes)
- Custom UI components in `packages/ui/src/` (shadcn-ui components go here)

### State Management
- tRPC with TanStack Query for server state
- React Context for client state (auth, preferences, etc.)
- Form state with react-hook-form + Zod validation

### TypeScript Conventions
- Prefer inline prop types over named interfaces for simple component props
- Example: `function Component({ prop }: { prop: string })` instead of defining a separate interface
- Only create named interfaces when they're reused or complex
- Create separate import statements for types (use `import type`)
- Prefer `React.useState`, `React.useEffect`, etc. over standalone imports (`useState`, `useEffect`)
- Prefer implicit over explicit return types

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

### Component Conventions
- Prefer composable components in the style of shadcn UI over large monolithic components
- Keep component props minimal — pass only the bare minimum information needed
- Add `"use client"` directive to the top of any `.tsx` file that requires client-side JavaScript

### File Organization
- Route handlers follow Next.js App Router conventions
- Always use kebab-case for file names

### Directory Structure (apps/web/src)

**Layering** — import direction is `app → features → components → lib`. Each layer may import from layers to its right, and anything may import `lib`. Nothing outside `app/` imports `@/app/*`. Boundaries are lint-enforced via `noRestrictedImports` in `apps/web/biome.json`; existing violations live on a shrinking migration allowlist there.

- `app/` — routing only. Pages/routes are thin adapters composing `features/*`. A route-private `components/` folder is allowed for exactly one route segment; the moment a second segment needs a component, it moves to the owning feature.
- `features/<domain>/` — the product (see below).
- `components/` — shared, domain-agnostic UI only. Admission test: "could this ship in a different product?" Must not import from `features/` or `app/`. Cross-app reusables graduate to `packages/ui`.
- `lib/` — infrastructure and cross-cutting clients (auth config, cache, datetime, errors, feature flags, rate limiting, storage). Never imports from `features/`, `components/`, or `app/`.

**What is a feature** — a feature owns at least one of: a database entity, an external integration, or server-side lifecycle logic. UI-only folders are NOT features — they belong in `components/` or an owning feature's `components/`. Create the folder when the first server logic for a new domain noun appears — never speculatively, never for a component alone. Sub-concerns are subdirectories of their parent feature (e.g. `space/member/`), not sibling features.

**Feature file vocabulary** — closed set; new file names require a team decision. Applies recursively in sub-concern directories:

- `data.ts` — parameterized reads (Prisma queries), must start with `import "server-only"`. Trusts its input: every query takes explicit arguments and carries its tenant scope in the where clause. Never reads the request — no `next/headers`, `next/navigation`, or session state (lint enforced)
- `loaders.ts` — request facing reads: resolve the actor from the session, apply page semantics (redirects to /login and /setup, `InvalidSessionError` on bans), and delegate to `data.ts` with proven scope. Loaders always consume `data.ts`, never the reverse, and never import `@rallly/database` — so query logic cannot fork between the session path and the API path. Server components call loaders; API routes, webhooks and cron call `data.ts` with proven scope from their own gate (API routes are lint banned from `@/features/**/loaders`). Naming note: `session-data.ts` and `queries.ts` were considered and rejected
- `mutations.ts` — writes + cache invalidation, must start with `import "server-only"`. Trusts its input: takes explicit parameters (`userId`, not headers), no session reads, no `headers()`, callable from system contexts (webhooks, cron, moderation). Authorization happens in `actions.ts` (safe-action middleware + CASL against the database). Never call Better-Auth endpoints from a mutation — they resolve the target user from request headers and authorize against the session snapshot; use adapter-level APIs (`authLib.$context` → `internalAdapter`) instead
- `actions.ts` — `"use server"` actions, thin wrappers over mutations, validated via safe-action + `schema.ts`. Owns authentication and authorization (safe-action clients + CASL checks against database state, never against the session snapshot). Exception to the thin-wrapper rule: writes whose target user is defined by the session (self-profile updates) call the Better-Auth endpoint directly in the action — the endpoint refreshes the session snapshot and cookie cache in one step. Rule of thumb: target user from a parameter → mutation via `internalAdapter`; target user from the session → Better-Auth endpoint in the action
- `schema.ts` — Zod schemas (isomorphic, no Prisma imports)
- `types.ts` — domain types
- `ability.ts` — CASL permissions
- `constants.ts`
- `utils.ts` — pure domain helpers, co-located `*.test.ts`
- `client.tsx` — client entry: providers, context, hooks, stores (no separate `hooks.ts` or store files)
- `service.ts` — external integration client (class/factory wrapping a third-party API), must start with `import "server-only"`
- `components/` — feature UI (no components at feature root)
- `assets/` — static files used by the feature
- NOT allowed: `index.ts` barrels, `helpers.ts`, `queries.ts`, `hooks.ts`, `lib/`, `libs/`

**Read/write symmetry** — the request facing / core split is the same on both sides:

|  | Request facing (session, redirects, auth) | Core (parameterized, trusts input) |
| -- | -- | -- |
| Reads | `loaders.ts` | `data.ts` |
| Writes | `actions.ts` | `mutations.ts` |

**Loader placement** — route by default, promote on the second consumer. Page data needs are view shaped, so the server component composes in the route: it calls the session gate loaders (`getActiveSpace()`, `requireUser()` — both trust the session cookie cache, no database read; `getCurrentUser()` is the database-verified read for pages that need DB-fresh user state) and passes proven scope to `data.ts` reads; extract to a route private file only when the page gets long. Never import another route's loader. Promote to `features/<domain>/loaders.ts` only when a second route segment needs the same read — that is evidence of a domain concept, not a view shape. The test: a loader belongs in the feature when its contract is stated in domain terms and every consumer wants exactly that contract; it stays in the route when its shape is "what this page happens to display." Most features never have a `loaders.ts` (today: `space`, `user`).

**DAL enforcement** — `@rallly/database` may only be imported from `features/**/data.ts` and `features/**/mutations.ts` (lint-enforced via `noRestrictedImports`; existing violations sit on a shrinking migration allowlist in `apps/web/biome.json`; `loaders.ts` is absent from the allowlist, so database imports are banned there by default). Parameterized reads take their tenant scope as `spaceId: AuthorizedSpaceId` (from `@/features/space/types`); only the session gate (`createSpaceDTO`) and the API key middleware may cast to it. API routes under `app/api/**` (except tRPC and better-auth) must not import `@/features/**/loaders` — they authenticate their own way and pass proven scope to parameterized reads. `api/private` handlers own serialization and must parse response bodies through their zod schemas.

**Cross-feature imports** — allowed, public surface only (the vocabulary files above); never reach into another feature's internals. No cycles between features (CI-enforced). For UI, prefer composing multiple features at the page level in `app/` over feature-to-feature component imports.

**`trpc/` is frozen legacy transport** — queries only; routers call `features/*/data.ts`. No new mutations — writes are server actions calling `features/*/mutations.ts`.

### PostHog Event Naming
- Use the `category:object_action` pattern
- Lowercase only, snake_case, present-tense verbs
  - **category** — the context/flow (e.g. `poll_creation`, `account_settings`)
  - **object** — the component/element (e.g. `invite_link`, `manage_button`)
  - **action** — what happened (e.g. `click`, `copy`, `submit`)
- Example: `posthog?.capture("poll_creation:manage_button_click")`

## i18n & Localization

- i18next for internationalization
- Translation files in `public/locales/[lang]/`
- Crowdin integration for translation management
- Use `pnpm i18n:scan` to extract new translation keys
- **IMPORTANT**: When TypeScript errors occur for missing i18n keys, run `pnpm i18n:scan` instead of manually adding keys. This command automatically scans the codebase for `Trans` components and generates the necessary translation entries.
- **IMPORTANT**: Never manually add translations to `.json` files. This is handled by tooling.
- **Pluralization**: Always use ICU message format for plurals. Example: `{count, plural, =0 {No items} one {1 item} other {# items}}` instead of separate singular/plural translation keys.
- i18n keys are in camelCase and should describe the message (e.g. `"lastUpdated": "Last Updated"`)
- If an i18n key is not intended to be reused, prefix it with the component name in camelCase
- In client components, use the `<Trans>` component from `@/i18n/client` with the `defaults` prop:
  ```tsx
  import { Trans } from "@/i18n/client";
  <Trans i18nKey="menu" defaults="Menu" />
  ```
- On the server, use `getTranslations` from `@/i18n/server`:
  ```ts
  const { t } = await getTranslations();
  t("menu", { defaultValue: "Menu" });
  ```