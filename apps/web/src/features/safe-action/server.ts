"server-only";
import { requireUserAbility } from "@/auth/queries";
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
    cause,
  }: {
    code: ActionErrorCode;
    message: string;
    cause?: unknown;
  }) {
    super(`[${code}]: ${message}`);
    this.name = "ActionError";
    this.code = code;
    this.cause = cause;
  }
}

export const actionClient = createSafeActionClient({
  handleServerError: async (error) => {
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
  const { user, ability } = await requireUserAbility();

  return next({
    ctx: { user, ability },
  });
});
