import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getEventsChronological,
  getUpcomingEventCount,
} from "@/features/scheduled-event/data";
import type { Status } from "@/features/scheduled-event/schema";
import {
  getActiveSpaceForUser,
  getOwnedSpace,
  getSpaceSeatCount,
  getTotalSeatsForSpace,
} from "@/features/space/data";
import type { SpaceContentScope } from "@/features/space/types";
import { createSpaceContentScope } from "@/features/space/utils";
import { loadUser } from "@/features/user/loaders";
import { getSessionState } from "@/lib/auth";
import { getDeviceTimeZone } from "@/lib/datetime/server";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

/**
 * The active space for the signed-in user, gated for server rendering:
 * redirects to /login when unauthenticated or a guest, redirects to /setup
 * when the user has no name, timezone, time format, or space at all, and
 * throws InvalidSessionError when banned.
 * React cached, so every page and layout that needs the space in a request
 * shares one gate and one query. Server component/page use only — the
 * redirects make it unsuitable for route handlers and tRPC procedures.
 */
export const loadActiveSpace = cache(async () => {
  const state = await getSessionState();

  // An unreadable session (store unreachable, transient failure) is not
  // "logged out" — redirecting to /login on it is one leg of a redirect
  // loop. Fail the render instead so the user gets the error boundary's
  // retry page.
  if (state.status === "error") {
    throw new Error("Failed to read session");
  }

  const user =
    state.status === "authenticated" ? state.session.user : undefined;

  if (!user || user.isGuest) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  const onboarding = await resolveOnboarding(user);

  if (onboarding.status === "ownedSpaceInactive") {
    // The owner's own membership is always effective, so this means their
    // row is gone, which a database trigger forbids. /setup would bounce
    // them straight back; fail loudly instead of looping.
    throw new Error("Space owner has no membership row");
  }

  if (onboarding.status === "incomplete") {
    redirect(
      buildSafeRedirectUrl({
        destination: "/setup",
        returnUrl: await getPathname(),
      }),
    );
  }

  return onboarding.space;
});

/**
 * Sends a signed-in account that hasn't finished onboarding through /setup,
 * then back. For routes that admit guests (poll admin, new poll), where
 * loadActiveSpace's redirects would be wrong: guests and signed-out visitors
 * pass through untouched. Without it, an account created from a guest
 * session lands back on its claimed poll and never reaches /setup, so the
 * space is never created and the guest polls are never adopted. Uses the
 * same onboarding rule as loadActiveSpace so the two gates and /setup agree.
 */
export const loadOnboardingGate = cache(async () => {
  const state = await getSessionState();

  if (state.status !== "authenticated" || state.session.user.isGuest) {
    return;
  }

  const { user } = state.session;

  if (user.banned) {
    throw new InvalidSessionError();
  }

  const onboarding = await resolveOnboarding(user);

  if (onboarding.status === "incomplete") {
    redirect(
      buildSafeRedirectUrl({
        destination: "/setup",
        returnUrl: await getPathname(),
      }),
    );
  }
});

/**
 * Whether the account has finished onboarding. Accounts created through the
 * OTP registration flow start without a name; /setup collects one before
 * they can use the app. Timezone and time format are deliberately NOT gated
 * on: both resolve without a stored value (zone from the per-visit cookie,
 * format from getLocaleDefaults), and gating on them dragged long-standing
 * accounts that predate those columns back through onboarding. Only a user
 * with no space at all is sent to set one up.
 */
async function resolveOnboarding(user: { id: string; name: string }) {
  if (!user.name) {
    return { status: "incomplete" } as const;
  }

  const space = await getActiveSpaceForUser(user.id);

  if (space) {
    return { status: "complete", space } as const;
  }

  if (await getOwnedSpace(user.id)) {
    return { status: "ownedSpaceInactive" } as const;
  }

  return { status: "incomplete" } as const;
}

/**
 * The visibility scope space-scoped content reads must apply for the
 * signed-in user in their active space. Same gating as loadActiveSpace;
 * server component/page use only.
 */
export const loadActiveSpaceContentScope = cache(
  async (): Promise<SpaceContentScope> => {
    const [space, user] = await Promise.all([loadActiveSpace(), loadUser()]);
    return createSpaceContentScope({ space, userId: user.id });
  },
);

/**
 * The active space for the signed-in user, or null when there is none: the
 * visitor is unauthenticated, a guest, or has no effective membership. For
 * routes that admit guests, where loadActiveSpace's redirects would be wrong.
 * Bans still throw, as in loadActiveSpace.
 */
export const loadOptionalActiveSpace = cache(async () => {
  const state = await getSessionState();

  if (state.status !== "authenticated" || state.session.user.isGuest) {
    return null;
  }

  if (state.session.user.banned) {
    throw new InvalidSessionError();
  }

  return getActiveSpaceForUser(state.session.user.id);
});

/**
 * Upcoming event count for the signed-in user's active space. Lives here
 * rather than in scheduled-event/loaders.ts because account-deletion (user)
 * imports scheduled-event, so a scheduled-event → space/user loader would
 * close a feature import cycle; space → scheduled-event is a forward edge.
 */
// Upcoming and past are measured against the viewer's present, so the device
// zone wins; the stored preference is a fallback for devices whose zone
// cookie hasn't been set yet. The session zone override never applies.
const loadViewerTimeZone = cache(async () => {
  const [user, deviceTimeZone] = await Promise.all([
    loadUser(),
    getDeviceTimeZone(),
  ]);
  return deviceTimeZone ?? normalizeTimeZone(user.timeZone) ?? "UTC";
});

export const loadUpcomingEventCount = cache(async () => {
  const [scope, timeZone] = await Promise.all([
    loadActiveSpaceContentScope(),
    loadViewerTimeZone(),
  ]);

  return getUpcomingEventCount({ scope, timeZone });
});

export const loadEvents = cache(
  async ({
    status,
    q,
    member,
    page,
    pageSize,
  }: {
    status: Status;
    q?: string;
    member?: string;
    page: number;
    pageSize: number;
  }) => {
    const [scope, timeZone] = await Promise.all([
      loadActiveSpaceContentScope(),
      loadViewerTimeZone(),
    ]);

    return getEventsChronological({
      status,
      search: q,
      member,
      page,
      pageSize,
      scope,
      timeZone,
    });
  },
);

/**
 * Seat usage for the signed-in user's active space. Session scoped —
 * server component/page use only, per loadActiveSpace.
 */
export const loadSeatUsage = cache(async () => {
  const space = await loadActiveSpace();

  const [total, used] = await Promise.all([
    getTotalSeatsForSpace(space.id),
    getSpaceSeatCount(space.id),
  ]);

  return { total, used };
});
