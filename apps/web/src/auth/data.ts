import "server-only";

import { createSessionUserDTO } from "@/features/user/data";
import { getSession } from "@/lib/auth";

/**
 * Gets the current user from the session if they are logged in, otherwise
 * null. Does not verify the user against the database — existence is
 * checked when the user triggers a mutation or server action.
 */
export const getCurrentUser = async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  return createSessionUserDTO(session.user);
};
