import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as z from "zod";
import { hasPollAdminAccess } from "@/features/poll/data";
import { listPollInvites } from "@/features/poll/invite/data";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import {
  derivePollInviteStatus,
  getPollInvitePath,
} from "@/features/poll/invite/utils";
import { publicProcedure, router } from "../../trpc";

export const invites = router({
  /**
   * The invites a viewer may see for a poll. Guests and non-admins get an
   * empty list rather than an error: the poll page renders for them and the
   * share dialog hides the email section itself.
   */
  list: publicProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ ctx, input }): Promise<PollInviteListItem[]> => {
      const user = ctx.user;

      if (
        !user ||
        user.isGuest ||
        !(await hasPollAdminAccess(input.pollId, user.id))
      ) {
        return [];
      }

      const invites = await listPollInvites({ pollId: input.pollId });

      return invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        status: derivePollInviteStatus(invite),
        inviteUrl: absoluteUrl(
          getPollInvitePath({ pollId: input.pollId, token: invite.token }),
        ),
      }));
    }),
});
