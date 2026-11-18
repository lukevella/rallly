# Features Rallly du groupe

Projet « Dev avec Docker » : 2 features du catalogue + 1 feature libre (sujet §4).
Chaque section ci-dessous tient lieu d'issue : contexte, périmètre, critères de démo, tâches.

| # | Feature | Type | Ancrage upstream | Branche | Responsable | État |
|---|---|---|---|---|---|---|
| 1 | [Block voting on past dates/times](#1-catalog-5--block-voting-on-past-datestimes) | Catalogue n°5 | [#1677](https://github.com/lukevella/rallly/issues/1677) | `FeatureNikita` | _à définir_ | 🚧 En cours |
| 2 | [Restrict comments to signed-in users](#2-catalog-9--variant--restrict-comments-to-signed-in-users) | Catalogue n°9 (variante) | [#224](https://github.com/lukevella/rallly/discussions/224) | `feature/comments-signed-in-only` | _à définir_ | ⏳ À faire |
| 3 | [Map Authentik groups to Rallly permissions](#3-free-feature--map-authentik-oidc-groups-to-rallly-permissions) | Feature libre | [#3639](https://github.com/lukevella/rallly/discussions/3639) | `feature/oidc-group-permissions` | _à définir_ | ⏳ À faire |

**Façon de travailler.** Une branche par feature depuis `main`, puis une PR vers `main` : la CI construit et scanne
l'image. Les commits de chaque feature restent séparés de l'infra, pour permettre une PR upstream (bonus §4.4).

---

## 1. [Catalog #5] Block voting on past dates/times

> Upstream: [lukevella/rallly#1677, "Users can respond to polls with times in the past"](https://github.com/lukevella/rallly/issues/1677)

### Context

Rallly can already *hide* past options in the results (`pastPredicate` in
`apps/web/src/features/poll/vote/components/vote-panel.tsx`), but participants can still **vote** on them,
from the UI and from the API.

### Goal

An option that is already in the past can no longer receive a new or changed vote,
in the UI **and** on the server.

### Definition of "past"

Reuse and share the existing rule from `vote-panel.tsx`:
- **time slot**: past once `startTime` is reached (a meeting that has started can no longer be picked);
- **all-day date** (floating date stored as UTC midnight): past once the calendar date has moved on.
  - Client side: in the viewer's time zone (as `pastPredicate` already does).
  - Server side: lenient. The date is past only when it is over everywhere (`startTime + 36h < now`, i.e. UTC-12),
    so nobody west of UTC is wrongly blocked.

Move the predicate into a shared util (e.g. `apps/web/src/features/poll/utils.ts`) and unit-test it.

### Scope

- **UI**: past options are visible but **disabled** (greyed out, not clickable, with a "Past" tooltip/label)
  in the desktop grid and the mobile view.
- **Server**: `apps/web/src/features/poll/participant/mutations.ts`
  - `addParticipant`: votes on past options are rejected (explicit `pastOption` refusal, or dropped and stored as no vote).
  - `updateParticipantVotes`: a participant editing their response **keeps their existing vote** on past options,
    and only future options can change (no data loss).
- **API** `/api/v1` and `/api/private`: same rule, since they go through the same mutations.

**Out of scope**: preventing the organizer from creating past options; finalizing a past option (still allowed).

### Acceptance criteria / demo

- [ ] Poll with one past slot and one future slot: the past slot is greyed out and cannot be selected.
- [ ] A forged request (devtools/API) voting "yes" on the past slot is **rejected** server-side.
- [ ] An existing participant edits their response: their old vote on the past slot is preserved, and future slots can change.
- [ ] All-day date "today" is still votable for a user in America/Los_Angeles, and yesterday's date is not.
- [ ] Unit tests for the shared predicate (time slot, all-day, time zone edge cases) and for the mutation refusal.

### Tasks

- [x] Extract and share `isOptionPast` (client + server) + unit tests
- [x] Disable past options in the voting UI (desktop + mobile)
- [x] Server-side guard in `addParticipant` / `updateParticipantVotes`
- [x] Mutation tests
- [ ] Screenshots + docs
- [ ] (Bonus) Upstream PR referencing #1677

---

## 2. [Catalog #9 – variant] Restrict comments to signed-in users

> Upstream: [lukevella/rallly#224, "Disable comments"](https://github.com/lukevella/rallly/discussions/224)

### Context

Catalog feature #9 is **already shipped upstream**: `Poll.disableComments` (default `true`), toggles in the
create/edit poll forms, and a server-side refusal in `addComment` (`apps/web/src/features/poll/comment/mutations.ts`).

As allowed by the project brief (§3.5) for features already delivered upstream, we implement a **variant**:
a middle ground between "everyone can comment" and "comments off".

### Problem

With comments enabled, any anonymous guest can post under any name. In an organization where Rallly sits
behind SSO (Authentik), organizers want guests to **read** the discussion while only **identified users**
can write, so every comment is tied to a real account.

### Scope

New poll setting **"Only signed-in users can comment"**:
- Prisma: `Poll.commentsRequireAuth Boolean @default(false)` + migration (additive, so behavior is unchanged by default).
- Create/edit poll form: new toggle under the existing comments setting, disabled when comments are off.
- Server, `addComment` (same locked `SELECT … FOR UPDATE` as `disable_comments`): refuse with a new
  `CommentRefusedError("authRequired")` when the setting is on and the author is a guest / has no `userId`.
- UI (comments sheet): guests see the comments plus a "Sign in to comment" call to action (link to login) instead of the form.
- tRPC + `/api/v1` / `/api/private` schemas: expose and accept `commentsRequireAuth`.

**Out of scope**: per-group comment permissions; moderating existing guest comments.

### Acceptance criteria / demo

- [ ] `alice` creates a poll with comments on + "Only signed-in users can comment".
- [ ] Anonymous guest (private window) opens the invite link: they **see** comments, but the form is replaced by "Sign in to comment".
- [ ] A forged guest request to add a comment is **rejected** server-side (`authRequired`).
- [ ] `bob` signs in through Authentik and can comment, and his comment shows his IdP name.
- [ ] Setting off: same behavior as upstream (no regression). Comments off: the new toggle is disabled.
- [ ] Unit/integration tests for the refusal.

### Tasks

- [ ] Prisma field + migration
- [ ] Form toggle (create + edit) + i18n keys (en/fr)
- [ ] Server-side guard in `addComment`
- [ ] Comments sheet: guest view with "Sign in to comment"
- [ ] tRPC / API schemas
- [ ] Tests
- [ ] Screenshots + docs

---

## 3. [Free feature] Map Authentik (OIDC) groups to Rallly permissions

> Upstream proposal: [lukevella/rallly#3639](https://github.com/lukevella/rallly/discussions/3639),
> related idea: [#352, "Only allow admins to create polls"](https://github.com/lukevella/rallly/discussions/352)

### Context

Rallly is deployed behind Authentik (OIDC). Authentik already manages the `rallly-admins` and `rallly-users`
groups and uses them to allow or deny access to the application (see `infra/docs/authentik.md`).

Once a user is signed in, **Rallly completely ignores these groups**:
- the Rallly admin role can only be granted manually (`INITIAL_ADMIN_EMAIL`, then "Make me an admin" in `/control-panel`);
- **any signed-in user can create polls**.

The current OIDC support only reads `name`, `email` and `picture` (`OIDC_*_CLAIM_PATH`): nothing exists for groups.

### Problem solved

In an organization, the IdP should be **the single source of truth for permissions**. Only some people
(HR, managers, organizers) should create polls, while everyone else votes. Adding or removing someone from an
Authentik group should be enough, with no change needed in Rallly.

### Scope

Three new environment variables, following the existing `OIDC_*_CLAIM_PATH` convention:

| Variable | Default | Effect |
|---|---|---|
| `OIDC_GROUPS_CLAIM_PATH` | `groups` | Path to the claim containing the groups (dot notation) |
| `OIDC_ADMIN_GROUPS` | *(empty)* | Members of any of these groups get `role = admin` on every OIDC sign-in; everyone else gets `user` |
| `OIDC_POLL_CREATOR_GROUPS` | *(empty)* | When set, only members of these groups can create polls |

Comma-separated lists. **Empty variable = current behavior unchanged** (backward compatible, required for an upstream PR).

**Out of scope**: background synchronization (permissions are recomputed **at sign-in**); Google / Microsoft
providers (generic OIDC only); admin UI for group mappings.

### Technical notes

- **Claim**: Authentik's `profile` scope already sends `groups: [...]`. No IdP configuration is needed.
- **Reading**: `apps/web/src/lib/auth.ts`, `genericOAuth`, `mapProfileToUser` (reuse `getValueByPath`).
  Persist the groups on the user (new Prisma field `oidcGroups String[]`) and update `role`
  (existing `UserRole` enum in `packages/database/prisma/models/user.prisma`).
  Note: `mapProfileToUser` only runs on account creation, so a hook running on every sign-in is needed
  (`databaseHooks` / `account` / `session`).
- **Env vars**: `apps/web/src/env.ts` (zod schema + `runtimeEnv`).
- **Server-side check (required)**: `createPoll` in `apps/web/src/features/poll/mutations.ts`, the common entry
  point for the UI and the `/api/private` and `/api/v1` APIs. Reject with an explicit error (`FORBIDDEN`).
- **UI**: hide the "Create" button and the home page "Actions" card, and show a clear message on `/new`.
- **Tests**: unit tests for the mapping function (groups to role and permission), plus a test for the rejected mutation.

### Acceptance criteria / demo

- [ ] `alice` (`rallly-admins`) signs in: she is **Rallly admin** automatically, without "Make me an admin".
- [ ] `alice` can create a poll.
- [ ] `bob` (`rallly-users`) can see and vote on polls but **does not see** "Create".
- [ ] `bob` calls poll creation directly (`/new` or the API): **rejected** with an explicit message.
- [ ] In Authentik, add `bob` to `rallly-admins`, then he signs in again: he becomes admin and can create polls.
- [ ] Remove him from the group, then he signs in again: he loses these permissions.
- [ ] Variables unset: behavior identical to upstream (no regression).
- [ ] `.env.example`, `compose.yml` and docs updated (`OIDC_ADMIN_GROUPS=rallly-admins`, `OIDC_POLL_CREATOR_GROUPS=rallly-admins`).

### Tasks

- [ ] Prisma schema (`oidcGroups`) + migration
- [ ] Env vars in `env.ts`
- [ ] Group mapping on every OIDC sign-in (role + groups)
- [ ] Server-side guard in `createPoll`
- [ ] Hide UI + message on `/new`
- [ ] Unit tests
- [ ] Infra wiring (`compose.yml`, `.env.example`) + docs + screenshots
- [ ] (Bonus) Upstream PR to `lukevella/rallly`
