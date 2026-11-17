import "server-only";

import { cache } from "react";
import { canUserManagePoll } from "@/features/poll/data";
import { loadPollDetails } from "@/features/poll/loaders";
import { getSession } from "@/lib/auth";

/**
 * Whether the viewer may manage this poll: its owner, or a member of the
 * space it belongs to when that space is shared. Returns false rather than
 * redirecting, because the invite page shows everyone the participant view
 * and only offers the host a way through to the admin page.
 */
export const loadCanManagePoll = cache(async (pollId: string) => {
  const [poll, session] = await Promise.all([
    loadPollDetails(pollId),
    getSession(),
  ]);

  const user = session?.user;
  if (!poll || !user) {
    return false;
  }

  return canUserManagePoll(user, poll);
});
