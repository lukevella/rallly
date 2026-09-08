import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { hasPollAdminAccess } from "@/features/poll/data";
import { listPollInvites } from "@/features/poll/invite/data";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import {
  derivePollInviteStatus,
  getPollInvitePath,
} from "@/features/poll/invite/utils";
import { privateProcedure, router } from "../../trpc";

export const invites = router({
  list: privateProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ ctx, input }): Promise<PollInviteListItem[]> => {
      if (!(await hasPollAdminAccess(input.pollId, ctx.user.id))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
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
