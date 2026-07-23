import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getActiveSpaceForUser,
  getOwnedSpace,
  getSpaceSeatCount,
  getTotalSeatsForSpace,
} from "@/features/space/data";
import { getSessionState } from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";
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
export const getActiveSpace = cache(async () => {
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

  // Accounts created through the OTP registration flow start without a
  // name, timezone, or time format; /setup collects them before they can
  // use the app. Pre-existing accounts missing any of these go through
  // the same (prefilled) form once.
  if (!user.name || !user.timeZone || !user.timeFormat) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/setup",
        returnUrl: await getPathname(),
      }),
    );
  }

  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    // Only send them to onboarding when they genuinely have no space.
    // A user can resolve to no *active* space while still owning one
    // (their only other memberships are ineffective, or their own
    // membership row is gone) — /setup would bounce them straight back,
    // so fail the render instead of looping.
    if (await getOwnedSpace(user.id)) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "No accessible space for user",
      });
    }

    redirect(
      buildSafeRedirectUrl({
        destination: "/setup",
        returnUrl: await getPathname(),
      }),
    );
  }

  return space;
});

/**
 * Seat usage for the signed-in user's active space. Session scoped —
 * server component/page use only, per getActiveSpace.
 */
export const getSeatUsage = cache(async () => {
  const space = await getActiveSpace();

  const [total, used] = await Promise.all([
    getTotalSeatsForSpace(space.id),
    getSpaceSeatCount(space.id),
  ]);

  return { total, used };
});
