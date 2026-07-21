import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getUser } from "@/features/user/data";
import type { UserDTO } from "@/features/user/schema";
import { getSession, getSessionState } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";

/**
 * The current signed-in user, fetched from the database. Returns null
 * when there is no session or the user is a guest — the caller decides
 * how to respond (redirect, 401, etc.). Throws InvalidSessionError when
 * the session references a user that no longer exists or is banned.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  const user = await getUser(session.user.id);

  if (!user || user.banned) {
    throw new InvalidSessionError();
  }

  return user;
});

/**
 * Gate for server pages that require a logged-in (non-guest) user.
 * Trusts the session cookie cache (no database read). Redirects to /login
 * when unauthenticated, fails the render on an unreadable session so a
 * transient session-store failure can't feed a / ↔ /login redirect loop.
 * Use getCurrentUser where the user is optional or must be read from the
 * database (mutation gates, stale-role-sensitive pages).
 */
export const requireUser = cache(async (): Promise<UserDTO> => {
  const state = await getSessionState();

  if (state.status === "error") {
    throw new Error("Failed to read session");
  }

  const user =
    state.status === "authenticated" ? state.session.user : undefined;

  if (!user || user.isGuest) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/login", returnUrl: pathname }),
    );
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  return user;
});
