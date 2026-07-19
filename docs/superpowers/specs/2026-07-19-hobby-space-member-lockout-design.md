# Hobby Space Member Lockout (RAL-1391)

## Problem

When a Pro space is downgraded to hobby, `syncSpaceTier` updates the tier,
disables custom branding, and deletes pending invites, but existing
`spaceMember` rows are untouched. Members keep full access through
`spaceProcedure`, which resolves the active space purely by membership with no
tier check. A multi member hobby space is effectively a free team, which
undermines seat billing as the upgrade lever. The overage is also invisible to
the owner because the hobby members page no longer shows seat usage.

## Decision

Soft-lock at read time. Membership in a hobby space is only effective for the
space owner. No rows are deleted and nothing is written at downgrade time —
enforcement is derived from `space.tier` wherever memberships are resolved.

Rationale over the alternatives:

- **Delete members on downgrade** is destructive: a transient payment failure
  (card expiry flips the subscription inactive, recovery flips it back) would
  permanently eject a team and force re-invites. Rejected.
- **Grandfather and surface only** leaves the free team loophole open.
  Rejected.

Derived enforcement is self-healing: re-upgrade restores access instantly with
no data to restore, and transient downgrades do no damage.

## Core rule

A `spaceMember` row grants access iff:

- the instance is self-hosted (all spaces are treated as pro; note the DB tier
  for self-hosted spaces may say `hobby` — `createSpaceDTO` maps it), OR
- `space.tier === "pro"`, OR
- the member is the space owner (`space.ownerId === userId`).

Implemented as a shared effective-membership filter (Prisma where fragment for
user-scoped queries, with a pure predicate where a fetched row is checked
in code). Lives in the space feature's public surface.

## Enforcement sites

All user-scoped membership resolution applies the filter:

1. `getActiveSpaceForUser` (`features/space/data.ts`) — covers
   `spaceProcedure`, server pages via `getActiveSpace`, and space actions'
   `requireSpaceWithUpdateAbility`.
2. `spaces.list` (tRPC) — space switcher and account spaces page; locked
   spaces vanish from the member's list.
3. `setActiveSpaceAction` (`features/space/actions.ts`) — cannot select a
   locked space.
4. `canUserManagePoll` and `hasPollAdminAccess` (`features/poll/data.ts`) —
   locked members lose poll admin access granted via space membership.
5. `userHasSpaces` (`features/setup/utils.ts`) — a user whose only membership
   is locked is routed through `/setup` and creates their own space.
6. `linkAnonymousUser`'s local space resolution
   (`features/auth/mutations.ts`) — merged guest content must not land in a
   space the user cannot access.
7. The local active-space resolver in `(optional-space)/new/page.tsx`.

Not changed:

- `api/private` routes already return 403 for non-pro spaces (keys are soft
  disabled on downgrade).
- Space-scoped queries used by the owner (`spaces.listMembers`,
  `spaces.getSeats`, dashboard counts) keep returning all members — the owner
  must see the full roster.
- `syncSpaceTier` and the billing webhook are untouched.

## Member UX (locked out)

The space vanishes from their space list and switcher. If it was their only
space, the existing `/setup` flow gives them their own space. No new "locked
space" surface.

## Owner UX

The members page keeps listing everyone. On hobby spaces, non-owner rows get
an "Inactive" badge, derived client-side from
`space.tier === "hobby" && !member.isOwner` (self-hosted DTOs already report
`pro`, so no environment check is needed). An alert explains that members
lost access when the subscription ended and that upgrading restores them.

## Content ownership

Untouched. Polls created by locked members stay in the space and remain
manageable by the owner and other active members — the same semantics as
`removeMember` today.

## Re-upgrade

Access restores instantly for all members (derived state). If the new seat
quantity is below the member count, everyone is still active; the overage is
visible through the existing "N of M seats used" line and blocks new invites,
exactly as today. No new work.

## Known trade-offs (accepted)

- A locked-out member cannot self-leave a space they can no longer see; the
  membership row persists and counts a seat on re-upgrade. The owner manages
  the roster.
- No email notification to members or the owner on downgrade. Out of scope.

## Testing

- Unit tests for the effective-membership predicate/filter helper.
- Type-check and the existing integration suite must pass.
- New i18n keys go through `pnpm i18n:scan`, never hand-edited JSON.
