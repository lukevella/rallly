import "server-only";

import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";

/**
 * Gets the current user if they are logged in, otherwise null.
 * @returns The current user if they are logged in, otherwise null.
 */
export const getCurrentUser = async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return null;
  }

  return user;
};
