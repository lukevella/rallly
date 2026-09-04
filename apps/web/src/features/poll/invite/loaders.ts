import "server-only";

import { cache } from "react";
import { hasPollAdminAccess } from "@/features/poll/data";
import { listPollInvites } from "@/features/poll/invite/data";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import { derivePollInviteStatus } from "@/features/poll/invite/utils";
import { getCurrentUser } from "@/features/user/loaders";

/**
 * The invites a viewer may see for a poll. Guests and non-admins get an
 * empty list rather than a redirect: the poll page renders for them and the
 * share dialog hides the email section itself.
 */
export const loadPollInvites = cache(
  async (pollId: string): Promise<PollInviteListItem[]> => {
    const user = await getCurrentUser();

    if (!user || !(await hasPollAdminAccess(pollId, user.id))) {
      return [];
    }

    const invites = await listPollInvites({ pollId });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      status: derivePollInviteStatus(invite),
    }));
  },
);
