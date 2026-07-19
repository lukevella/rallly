# Hobby Space Member Lockout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Non-owner members of a hobby (downgraded) space lose access at read time, restored automatically on re-upgrade; owners see the inactive members on the members settings page. Spec: `docs/superpowers/specs/2026-07-19-hobby-space-member-lockout-design.md` (RAL-1391).

**Architecture:** One shared Prisma where-fragment helper (`effectiveSpaceMemberWhere`) encodes "membership counts only if the space is pro or the member owns it; self-hosted is exempt". Every user-scoped membership resolution query applies it. No schema changes, no webhook changes, no writes at downgrade time.

**Tech Stack:** Next.js app in `apps/web`, Prisma, tRPC (legacy queries), Vitest for unit tests.

## Global Constraints

- Working directory is the worktree `/Users/lukevella/Documents/rallly/.claude/worktrees/ral-1391-member-overage-d20f43`; run all commands from its root.
- Commit messages start with a gitmoji (https://gitmoji.dev) and end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Never hand-edit locale `.json` files; new `<Trans>` keys are extracted with `pnpm i18n:scan`.
- `import type` for type-only imports; `import * as z from "zod"` if zod is ever needed (it is not in this plan).
- Functions with multiple logical args take a single object parameter (named parameters).
- No hyphens in user-facing copy.
- The DB `SpaceTier` values are the lowercase strings `"hobby"` and `"pro"`.
- Self-hosted instances must be completely exempt: their DB tier may say `"hobby"` even though `createSpaceDTO` reports `"pro"`, so the DB-level filter must not apply when `isSelfHosted` is true.
- Prisma client must be generated (`pnpm db:generate`) before type-checking; it has already been run in this worktree.

---

### Task 1: Effective membership filter helper

**Files:**
- Create: `apps/web/src/features/space/member/utils.ts`
- Test: `apps/web/src/features/space/member/utils.test.ts`

**Interfaces:**
- Consumes: `isSelfHosted` from `@/lib/constants` (a module-level boolean constant), `Prisma.SpaceMemberWhereInput` type from `@rallly/database`.
- Produces: `effectiveSpaceMemberWhere({ userId }: { userId: string }): Prisma.SpaceMemberWhereInput` — every later task imports this from `@/features/space/member/utils`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/features/space/member/utils.test.ts`. Because `isSelfHosted` is a module-level constant, each case re-imports the module with a mocked `@/lib/constants`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

const loadModule = async ({ isSelfHosted }: { isSelfHosted: boolean }) => {
  vi.resetModules();
  vi.doMock("@/lib/constants", () => ({ isSelfHosted }));
  return await import("./utils");
};

afterEach(() => {
  vi.doUnmock("@/lib/constants");
  vi.resetModules();
});

describe("effectiveSpaceMemberWhere", () => {
  it("limits membership to pro spaces or owned spaces on cloud", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isSelfHosted: false,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
      OR: [{ space: { tier: "pro" } }, { space: { ownerId: "user-1" } }],
    });
  });

  it("does not limit membership on self hosted instances", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isSelfHosted: true,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @rallly/web exec vitest run src/features/space/member/utils.test.ts`
Expected: FAIL — cannot resolve `./utils` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/features/space/member/utils.ts`:

```ts
import type { Prisma } from "@rallly/database";
import { isSelfHosted } from "@/lib/constants";

/**
 * Membership in a hobby space is only effective for the space owner, so a
 * downgraded space locks out its other members until it is upgraded again.
 * Apply to every user-scoped membership resolution query. Self-hosted
 * instances are exempt: all their spaces are treated as pro regardless of
 * the tier stored in the database.
 */
export function effectiveSpaceMemberWhere({
  userId,
}: {
  userId: string;
}): Prisma.SpaceMemberWhereInput {
  if (isSelfHosted) {
    return { userId };
  }

  return {
    userId,
    OR: [{ space: { tier: "pro" } }, { space: { ownerId: userId } }],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @rallly/web exec vitest run src/features/space/member/utils.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/space/member/utils.ts apps/web/src/features/space/member/utils.test.ts
git commit -m "✨ Add effective space membership filter helper

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Core resolution — active space, space list, space selection

No unit test harness exists for Prisma-backed reads in this repo (only pure helpers are unit tested; flows are covered by Playwright). The test cycle for Tasks 2–4 is: type-check passes and the change is a mechanical application of the Task 1 helper.

**Files:**
- Modify: `apps/web/src/features/space/data.ts:169-180` (`getActiveSpaceForUser`)
- Modify: `apps/web/src/trpc/routers/spaces.ts:44-47` (`spaces.list`)
- Modify: `apps/web/src/features/space/actions.ts:52-60` (`setActiveSpaceAction`)

**Interfaces:**
- Consumes: `effectiveSpaceMemberWhere({ userId })` from `@/features/space/member/utils`.
- Produces: no new exports; `getActiveSpaceForUser` now returns `null` for a user whose only memberships are non-owner rows in hobby spaces, which makes `spaceProcedure` throw FORBIDDEN and `getActiveSpace` redirect to `/setup` — that is the intended behavior, not a regression.

- [ ] **Step 1: Filter `getActiveSpaceForUser`**

In `apps/web/src/features/space/data.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change the query in `getActiveSpaceForUser` from:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId,
    },
```

to:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: effectiveSpaceMemberWhere({ userId }),
```

- [ ] **Step 2: Filter `spaces.list`**

In `apps/web/src/trpc/routers/spaces.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change the query in the `list` procedure from:

```ts
    const result = await prisma.spaceMember.findMany({
      where: {
        userId: user.id,
      },
```

to:

```ts
    const result = await prisma.spaceMember.findMany({
      where: effectiveSpaceMemberWhere({ userId: user.id }),
```

Leave every other procedure in this router unchanged — `listMembers`, `getSeats`, and the dashboard counts intentionally keep showing all members to the owner, and `leave`/`leaveFromAccount` keep operating on raw membership rows.

- [ ] **Step 3: Filter `setActiveSpaceAction`**

In `apps/web/src/features/space/actions.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change the membership lookup from:

```ts
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: parsedInput.spaceId,
          userId: ctx.user.id,
        },
      },
    });
```

to:

```ts
    const member = await prisma.spaceMember.findFirst({
      where: {
        spaceId: parsedInput.spaceId,
        ...effectiveSpaceMemberWhere({ userId: ctx.user.id }),
      },
    });
```

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/space/data.ts apps/web/src/trpc/routers/spaces.ts apps/web/src/features/space/actions.ts
git commit -m "🐛 Resolve active space and space list through effective membership

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Poll admin access

**Files:**
- Modify: `apps/web/src/features/poll/data.ts:271-285` (`canUserManagePoll`) and `apps/web/src/features/poll/data.ts:295` (`hasPollAdminAccess`)

**Interfaces:**
- Consumes: `effectiveSpaceMemberWhere({ userId })` from `@/features/space/member/utils`.
- Produces: no new exports; locked members no longer get poll admin access via space membership. Poll authors (`poll.userId === user.id`) keep access regardless — that branch is untouched.

- [ ] **Step 1: Filter both membership checks**

In `apps/web/src/features/poll/data.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

In `canUserManagePoll`, change:

```ts
  if (poll.spaceId) {
    const space = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: poll.spaceId,
          userId: user.id,
        },
      },
    });
```

to:

```ts
  if (poll.spaceId) {
    const space = await prisma.spaceMember.findFirst({
      where: {
        spaceId: poll.spaceId,
        ...effectiveSpaceMemberWhere({ userId: user.id }),
      },
    });
```

In `hasPollAdminAccess`, change:

```ts
      OR: [{ userId: userId }, { space: { members: { some: { userId } } } }],
```

to:

```ts
      OR: [
        { userId: userId },
        { space: { members: { some: effectiveSpaceMemberWhere({ userId }) } } },
      ],
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/poll/data.ts
git commit -m "🐛 Apply effective membership to poll admin access

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Remaining resolution sites — setup, guest merge, new poll page

**Files:**
- Modify: `apps/web/src/features/setup/utils.ts:12-19` (`userHasSpaces`)
- Modify: `apps/web/src/features/auth/mutations.ts:9-23` (local `getActiveSpaceForUser`)
- Modify: `apps/web/src/app/[locale]/(optional-space)/new/page.tsx:21-43` (local `getActiveSpace`)

**Interfaces:**
- Consumes: `effectiveSpaceMemberWhere({ userId })` from `@/features/space/member/utils`.
- Produces: no new exports. A user whose only membership is locked is treated as having no spaces (`/setup` creates their own), merged guest content never lands in a locked space, and the `/new` page does not pick up branding from a locked space.

- [ ] **Step 1: Filter `userHasSpaces`**

In `apps/web/src/features/setup/utils.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change:

```ts
  const spaceCount = await prisma.spaceMember.count({
    where: {
      userId: userId,
    },
  });
```

to:

```ts
  const spaceCount = await prisma.spaceMember.count({
    where: effectiveSpaceMemberWhere({ userId }),
  });
```

- [ ] **Step 2: Filter the guest merge space resolution**

In `apps/web/src/features/auth/mutations.ts`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change the local `getActiveSpaceForUser` from:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId,
    },
```

to:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: effectiveSpaceMemberWhere({ userId }),
```

- [ ] **Step 3: Filter the `/new` page resolver**

In `apps/web/src/app/[locale]/(optional-space)/new/page.tsx`, add the import:

```ts
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
```

Change the local `getActiveSpace` query from:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId: session?.user.id,
    },
```

to:

```ts
  const spaceMember = await prisma.spaceMember.findFirst({
    where: effectiveSpaceMemberWhere({ userId: session.user.id }),
```

The guard above (`if (session?.user.isGuest || !session?.user.id) return null;`) already narrows `session` to non-null past that point; if TypeScript still complains, keep the guard as is and use `session?.user.id ?? ""` — do NOT weaken the guard. (Expected: `session.user.id` type-checks fine.)

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/setup/utils.ts apps/web/src/features/auth/mutations.ts "apps/web/src/app/[locale]/(optional-space)/new/page.tsx"
git commit -m "🐛 Apply effective membership to setup, guest merge and new poll page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Owner UX — inactive badge and explainer alert

**Files:**
- Modify: `apps/web/src/app/[locale]/(space)/settings/members/page-client.tsx`
- Modify (generated): `apps/web/public/locales/en/app.json` via `pnpm i18n:scan` — never by hand

**Interfaces:**
- Consumes: `useSpace()` from `@/features/space/client` (already used in this file) — the DTO is at `space.data`, and `space.data.tier` is already `"pro"` on self-hosted instances, so `tier === "hobby"` implies cloud. `members.total` comes from the existing `spaces.listMembers` query.
- Produces: user-visible copy only; no exports.

- [ ] **Step 1: Add the alert above the members list**

In `MembersSettingsPageClient`, inside the first `<PageSection>`'s `<PageSectionContent>`, directly above `<StackedList>`, add:

```tsx
{space.data.tier === "hobby" && members.total > 1 ? (
  <Alert variant="info">
    <InfoIcon />
    <AlertDescription>
      <p>
        <Trans
          i18nKey="membersInactiveDescription"
          defaults="Members are inactive because this space does not have an active subscription. Upgrade to Pro to restore their access."
        />
      </p>
    </AlertDescription>
  </Alert>
) : null}
```

`Alert`, `AlertDescription`, and `InfoIcon` are already imported in this file.

- [ ] **Step 2: Add the inactive badge to non-owner rows**

In the member row, the badge slot currently renders only the Owner badge:

```tsx
<div>
  {member.isOwner ? (
    <Badge>
      <Trans i18nKey="owner" defaults="Owner" />
    </Badge>
  ) : null}
</div>
```

Change it to:

```tsx
<div>
  {member.isOwner ? (
    <Badge>
      <Trans i18nKey="owner" defaults="Owner" />
    </Badge>
  ) : null}
  {space.data.tier === "hobby" && !member.isOwner ? (
    <Badge>
      <Trans i18nKey="memberInactive" defaults="Inactive" />
    </Badge>
  ) : null}
</div>
```

- [ ] **Step 3: Extract i18n keys**

Run: `pnpm i18n:scan`
Expected: `membersInactiveDescription` and `memberInactive` appear in `apps/web/public/locales/en/app.json`. Do not edit any locale JSON manually.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/[locale]/(space)/settings/members/page-client.tsx" apps/web/public/locales/en/app.json
git commit -m "💄 Surface inactive members to hobby space owners

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Full verification

**Files:** none new.

- [ ] **Step 1: Run the unit test suite**

Run: `pnpm test:unit`
Expected: all tests pass, including the two new ones from Task 1.

- [ ] **Step 2: Type-check the workspace**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Lint/format check on the branch**

Run: `pnpm check`
Expected: no errors in the files touched by this plan. If Biome reports formatting issues in touched files, run `pnpm check:fix`, re-run `pnpm check`, and amend the relevant commit or add a `🎨` commit.

- [ ] **Step 4: Confirm branch contents**

Run: `git log --oneline origin/main..HEAD`
Expected: only this plan's commits plus the spec commit (`📝 Add design spec for hobby space member lockout (RAL-1391)`).
