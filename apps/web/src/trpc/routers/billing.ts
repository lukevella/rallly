import { getSpaceSubscription } from "@/features/billing/data";
import { getActiveSpaceForUser } from "@/features/space/data";
import { isSelfHosted } from "@/utils/constants";
import { publicProcedure, router, spaceProcedure } from "../trpc";

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
  getSubscription: spaceProcedure.query(async ({ ctx }) => {
    return await getSpaceSubscription(ctx.space.id);
  }),
});
