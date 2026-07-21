import "server-only";

import { cache } from "react";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";

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
