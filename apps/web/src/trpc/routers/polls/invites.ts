import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { hasPollAdminAccess } from "@/features/poll/data";
import { listPollInvites } from "@/features/poll/invite/data";
import { derivePollInviteStatus } from "@/features/poll/invite/utils";
import { privateProcedure, router } from "../../trpc";

export const invites = router({
  list: privateProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!(await hasPollAdminAccess(input.pollId, ctx.user.id))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
      }

      const rows = await listPollInvites({ pollId: input.pollId });

      return rows.map((invite) => ({
        id: invite.id,
        email: invite.email,
        status: derivePollInviteStatus(invite),
        createdAt: invite.createdAt,
      }));
    }),
});
