import { requireUser } from "@/auth/queries";
import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await requireUser();

  return next({
    ctx: { user },
  });
});
