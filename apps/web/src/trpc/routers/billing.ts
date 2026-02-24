import { getActiveSpaceForUser } from "@/features/space/data";
import { isSelfHosted } from "@/utils/constants";
import { publicProcedure, router } from "../trpc";

export const billing = router({
  getTier: publicProcedure.query(async ({ ctx }) => {
    if (isSelfHosted) {
      return "pro" as const;
    }

    if (!ctx.user || ctx.user.isGuest) {
      return "hobby" as const;
    }

    const space = await getActiveSpaceForUser(ctx.user.id);

    return space?.tier ?? ("hobby" as const);
  }),
});
