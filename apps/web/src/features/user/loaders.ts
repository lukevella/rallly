import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";
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
 * The current signed-in user for pages that require auth: redirects to
 * /login when there is no session or the user is a guest, so callers
 * always get a user back. Use getCurrentUser where the user is optional.
 */
export const requireUser = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  return user;
};
