import * as z from "zod";

import { decryptToken } from "@/utils/session";
import { publicProcedure, router } from "../trpc";

export const auth = router({
  getUserPermission: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const res = await decryptToken<{ userId: string }>(input.token);

      if (!res) {
        return null;
      }

      return res;
    }),
});
