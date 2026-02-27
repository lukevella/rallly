---
name: create-auth-skill
description: Skill for creating auth layers in TypeScript/JavaScript apps using Better Auth.
---

# Create Auth Skill

Guide for adding authentication to TypeScript/JavaScript applications using Better Auth.

**For code examples and syntax, see [better-auth.com/docs](https://better-auth.com/docs).**

---

## Phase 1: Planning (REQUIRED before implementation)

Before writing any code, gather requirements by scanning the project and asking the user structured questions. This ensures the implementation matches their needs.

### Step 1: Scan the project

Analyze the codebase to auto-detect:
- **Framework** — Look for `next.config`, `svelte.config`, `nuxt.config`, `astro.config`, `vite.config`, or Express/Hono entry files.
- **Database/ORM** — Look for `prisma/schema.prisma`, `drizzle.config`, `package.json` deps (`pg`, `mysql2`, `better-sqlite3`, `mongoose`, `mongodb`).
- **Existing auth** — Look for existing auth libraries (`next-auth`, `lucia`, `clerk`, `supabase/auth`, `firebase/auth`) in `package.json` or imports.
- **Package manager** — Check for `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`.

Use what you find to pre-fill defaults and skip questions you can already answer.

### Step 2: Ask planning questions

Use the `AskQuestion` tool to ask the user **all applicable questions in a single call**. Skip any question you already have a confident answer for from the scan. Group them under a title like "Auth Setup Planning".

**Questions to ask:**

1. **Project type** (skip if detected)
   - Prompt: "What type of project is this?"
   - Options: New project from scratch | Adding auth to existing project | Migrating from another auth library

2. **Framework** (skip if detected)
   - Prompt: "Which framework are you using?"
   - Options: Next.js (App Router) | Next.js (Pages Router) | SvelteKit | Nuxt | Astro | Express | Hono | SolidStart | Other

3. **Database & ORM** (skip if detected)
   - Prompt: "Which database setup will you use?"
   - Options: PostgreSQL (Prisma) | PostgreSQL (Drizzle) | PostgreSQL (pg driver) | MySQL (Prisma) | MySQL (Drizzle) | MySQL (mysql2 driver) | SQLite (Prisma) | SQLite (Drizzle) | SQLite (better-sqlite3 driver) | MongoDB (Mongoose) | MongoDB (native driver)

4. **Authentication methods** (always ask, allow multiple)
   - Prompt: "Which sign-in methods do you need?"
   - Options: Email & password | Social OAuth (Google, GitHub, etc.) | Magic link (passwordless email) | Passkey (WebAuthn) | Phone number
   - `allow_multiple: true`

5. **Social providers** (only if they selected Social OAuth above — ask in a follow-up call)
   - Prompt: "Which social providers do you need?"
   - Options: Google | GitHub | Apple | Microsoft | Discord | Twitter/X
   - `allow_multiple: true`

6. **Email verification** (only if Email & password was selected above — ask in a follow-up call)
   - Prompt: "Do you want to require email verification?"
   - Options: Yes | No

7. **Email provider** (only if email verification is Yes, or if Password reset is selected in features — ask in a follow-up call)
   - Prompt: "How do you want to send emails?"
   - Options: Resend | Mock it for now (console.log)

8. **Features & plugins** (always ask, allow multiple)
   - Prompt: "Which additional features do you need?"
   - Options: Two-factor authentication (2FA) | Organizations / teams | Admin dashboard | API bearer tokens | Password reset | None of these
   - `allow_multiple: true`

9. **Auth pages** (always ask, allow multiple — pre-select based on earlier answers)
   - Prompt: "Which auth pages do you need?"
   - Options vary based on previous answers:
     - Always available: Sign in | Sign up
     - If Email & password selected: Forgot password | Reset password
     - If email verification enabled: Email verification
   - `allow_multiple: true`

10. **Auth UI style** (always ask)
   - Prompt: "What style do you want for the auth pages? Pick one or describe your own."
   - Options: Minimal & clean | Centered card with background | Split layout (form + hero image) | Floating / glassmorphism | Other (I'll describe)

### Step 3: Summarize the plan

After collecting answers, present a concise implementation plan as a markdown checklist. Example:

```
## Auth Implementation Plan

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL via Prisma
- **Auth methods:** Email/password, Google OAuth, GitHub OAuth
- **Plugins:** 2FA, Organizations, Email verification
- **UI:** Custom forms

### Steps
1. Install `better-auth` and `@better-auth/cli`
2. Create `lib/auth.ts` with server config
3. Create `lib/auth-client.ts` with React client
4. Set up route handler at `app/api/auth/[...all]/route.ts`
5. Configure Prisma adapter and generate schema
6. Add Google & GitHub OAuth providers
7. Enable `twoFactor` and `organization` plugins
8. Set up email verification handler
9. Run migrations
10. Create sign-in / sign-up pages
```

Ask the user to confirm the plan before proceeding to Phase 2.

---

## Phase 2: Implementation

Only proceed here after the user confirms the plan from Phase 1.

Follow the decision tree below, guided by the answers collected above.

```
Is this a new/empty project?
├─ YES → New project setup
│   1. Install better-auth (+ scoped packages per plan)
│   2. Create auth.ts with all planned config
│   3. Create auth-client.ts with framework client
│   4. Set up route handler
│   5. Set up environment variables
│   6. Run CLI migrate/generate
│   7. Add plugins from plan
│   8. Create auth UI pages
│
├─ MIGRATING → Migration from existing auth
│   1. Audit current auth for gaps
│   2. Plan incremental migration
│   3. Install better-auth alongside existing auth
│   4. Migrate routes, then session logic, then UI
│   5. Remove old auth library
│   6. See migration guides in docs
│
└─ ADDING → Add auth to existing project
    1. Analyze project structure
    2. Install better-auth
    3. Create auth config matching plan
    4. Add route handler
    5. Run schema migrations
    6. Integrate into existing pages
    7. Add planned plugins and features
```

At the end of implementation, guide users thoroughly on remaining next steps (e.g., setting up OAuth app credentials, deploying env vars, testing flows).

---

## Installation

**Core:** `npm install better-auth`

**Scoped packages (as needed):**
| Package | Use case |
|---------|----------|
| `@better-auth/passkey` | WebAuthn/Passkey auth |
| `@better-auth/sso` | SAML/OIDC enterprise SSO |
| `@better-auth/stripe` | Stripe payments |
| `@better-auth/scim` | SCIM user provisioning |
| `@better-auth/expo` | React Native/Expo |

---

## Environment Variables

```env
BETTER_AUTH_SECRET=<32+ chars, generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=<your database connection string>
```

Add OAuth secrets as needed: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, etc.

---

## Server Config (auth.ts)

**Location:** `lib/auth.ts` or `src/lib/auth.ts`

**Minimal config needs:**
- `database` - Connection or adapter
- `emailAndPassword: { enabled: true }` - For email/password auth

**Standard config adds:**
- `socialProviders` - OAuth providers (google, github, etc.)
- `emailVerification.sendVerificationEmail` - Email verification handler
- `emailAndPassword.sendResetPassword` - Password reset handler

**Full config adds:**
- `plugins` - Array of feature plugins
- `session` - Expiry, cookie cache settings
- `account.accountLinking` - Multi-provider linking
- `rateLimit` - Rate limiting config

**Export types:** `export type Session = typeof auth.$Infer.Session`

---

## Client Config (auth-client.ts)

**Import by framework:**
| Framework | Import |
|-----------|--------|
| React/Next.js | `better-auth/react` |
| Vue | `better-auth/vue` |
| Svelte | `better-auth/svelte` |
| Solid | `better-auth/solid` |
| Vanilla JS | `better-auth/client` |

**Client plugins** go in `createAuthClient({ plugins: [...] })`.

**Common exports:** `signIn`, `signUp`, `signOut`, `useSession`, `getSession`

---

## Route Handler Setup

| Framework | File | Handler |
|-----------|------|---------|
| Next.js App Router | `app/api/auth/[...all]/route.ts` | `toNextJsHandler(auth)` → export `{ GET, POST }` |
| Next.js Pages | `pages/api/auth/[...all].ts` | `toNextJsHandler(auth)` → default export |
| Express | Any file | `app.all("/api/auth/*", toNodeHandler(auth))` |
| SvelteKit | `src/hooks.server.ts` | `svelteKitHandler(auth)` |
| SolidStart | Route file | `solidStartHandler(auth)` |
| Hono | Route file | `auth.handler(c.req.raw)` |

**Next.js Server Components:** Add `nextCookies()` plugin to auth config.

---

## Database Migrations

| Adapter | Command |
|---------|---------|
| Built-in Kysely | `npx @better-auth/cli@latest migrate` (applies directly) |
| Prisma | `npx @better-auth/cli@latest generate --output prisma/schema.prisma` then `npx prisma migrate dev` |
| Drizzle | `npx @better-auth/cli@latest generate --output src/db/auth-schema.ts` then `npx drizzle-kit push` |

**Re-run after adding plugins.**

---

## Database Adapters

| Database | Setup |
|----------|-------|
| SQLite | Pass `better-sqlite3` or `bun:sqlite` instance directly |
| PostgreSQL | Pass `pg.Pool` instance directly |
| MySQL | Pass `mysql2` pool directly |
| Prisma | `prismaAdapter(prisma, { provider: "postgresql" })` from `better-auth/adapters/prisma` |
| Drizzle | `drizzleAdapter(db, { provider: "pg" })` from `better-auth/adapters/drizzle` |
| MongoDB | `mongodbAdapter(db)` from `better-auth/adapters/mongodb` |

---

## Common Plugins

| Plugin | Server Import | Client Import | Purpose |
|--------|---------------|---------------|---------|
| `twoFactor` | `better-auth/plugins` | `twoFactorClient` | 2FA with TOTP/OTP |
| `organization` | `better-auth/plugins` | `organizationClient` | Teams/orgs |
| `admin` | `better-auth/plugins` | `adminClient` | User management |
| `bearer` | `better-auth/plugins` | - | API token auth |
| `openAPI` | `better-auth/plugins` | - | API docs |
| `passkey` | `@better-auth/passkey` | `passkeyClient` | WebAuthn |
| `sso` | `@better-auth/sso` | - | Enterprise SSO |

**Plugin pattern:** Server plugin + client plugin + run migrations.

---

## Auth UI Implementation

**Sign in flow:**
1. `signIn.email({ email, password })` or `signIn.social({ provider, callbackURL })`
2. Handle `error` in response
3. Redirect on success

**Session check (client):** `useSession()` hook returns `{ data: session, isPending }`

**Session check (server):** `auth.api.getSession({ headers: await headers() })`

**Protected routes:** Check session, redirect to `/sign-in` if null.

---

## Security Checklist

- [ ] `BETTER_AUTH_SECRET` set (32+ chars)
- [ ] `advanced.useSecureCookies: true` in production
- [ ] `trustedOrigins` configured
- [ ] Rate limits enabled
- [ ] Email verification enabled
- [ ] Password reset implemented
- [ ] 2FA for sensitive apps
- [ ] CSRF protection NOT disabled
- [ ] `account.accountLinking` reviewed

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Secret not set" | Add `BETTER_AUTH_SECRET` env var |
| "Invalid Origin" | Add domain to `trustedOrigins` |
| Cookies not setting | Check `baseURL` matches domain; enable secure cookies in prod |
| OAuth callback errors | Verify redirect URIs in provider dashboard |
| Type errors after adding plugin | Re-run CLI generate/migrate |

---

## Resources

- [Docs](https://better-auth.com/docs)
- [Examples](https://github.com/better-auth/examples)
- [Plugins](https://better-auth.com/docs/concepts/plugins)
- [CLI](https://better-auth.com/docs/concepts/cli)
- [Migration Guides](https://better-auth.com/docs/guides)
