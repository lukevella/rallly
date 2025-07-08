"server-only";
import { requireUser } from "@/auth/queries";
import { createServerAbility } from "@/features/ability-manager/server";
import { posthog } from "@rallly/posthog/server";
import { waitUntil } from "@vercel/functions";
import { createSafeActionClient } from "next-safe-action";

type ActionErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR";

export class ActionError extends Error {
  code: ActionErrorCode;
  constructor({
    code,
    message,
  }: {
    code: ActionErrorCode;
    message: string;
  }) {
    super(`[${code}]: ${message}`);
    this.name = "ActionError";
    this.code = code;
  }
}

export const actionClient = createSafeActionClient({
  handleServerError: async (error) => {
    console.error(error);

    if (error instanceof ActionError) {
      return error.code;
    }

    return "INTERNAL_SERVER_ERROR";
  },
}).use(({ next }) => {
  const result = next({
    ctx: {
      posthog,
    },
  });

  waitUntil(Promise.all([posthog?.shutdown()]));

  return result;
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await requireUser();
  const ability = createServerAbility(user);

  return next({
    ctx: { user, ability },
  });
});
