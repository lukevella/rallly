"use server";

import { getActiveSpaceForUser } from "@/features/space/data";
import { loadOptionalUser } from "@/features/user/loaders";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import { getWebhookAccess } from "./data";
import {
  createWebhook,
  deleteWebhook,
  sendWebhookTestEvent,
  setWebhookEnabled,
} from "./mutations";
import {
  createWebhookInputSchema,
  deleteWebhookSchema,
  sendWebhookTestEventSchema,
  setWebhookEnabledSchema,
} from "./schema";

// The UI never offers these actions to users without webhook access, so a
// failed gate is unexpected here — throw for the global error handler.
async function requireWebhookAccess() {
  const user = await loadOptionalUser();

  if (!user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "You are not authenticated.",
    });
  }

  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Space not found",
    });
  }

  if (getWebhookAccess(user, space) !== "allowed") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Webhooks are not enabled for this user or space",
    });
  }

  return { user, space };
}

export const createWebhookAction = authActionClient
  .metadata({ actionName: "create_webhook" })
  .inputSchema(createWebhookInputSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { space } = await requireWebhookAccess();

    const result = await createWebhook({
      spaceId: space.id,
      url: parsedInput.url,
      events: parsedInput.events,
    });

    if (result.ok) {
      track(ctx.user, {
        event: "developer:webhook_create",
        groups: {
          space: space.id,
        },
      });
    }

    return result;
  });

export const setWebhookEnabledAction = authActionClient
  .metadata({ actionName: "set_webhook_enabled" })
  .inputSchema(setWebhookEnabledSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { space } = await requireWebhookAccess();

    await setWebhookEnabled({
      spaceId: space.id,
      webhookId: parsedInput.webhookId,
      enabled: parsedInput.enabled,
    });

    track(ctx.user, {
      event: parsedInput.enabled
        ? "developer:webhook_enable"
        : "developer:webhook_disable",
      groups: {
        space: space.id,
      },
    });
  });

export const deleteWebhookAction = authActionClient
  .metadata({ actionName: "delete_webhook" })
  .inputSchema(deleteWebhookSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { space } = await requireWebhookAccess();

    await deleteWebhook({
      spaceId: space.id,
      webhookId: parsedInput.webhookId,
    });

    track(ctx.user, {
      event: "developer:webhook_delete",
      groups: {
        space: space.id,
      },
    });
  });

// Each call is an outbound request to a URL the owner chose, so it is
// limited: enough to fix a receiver and try again, not enough to use Rallly
// to hammer someone else's server.
export const sendWebhookTestEventAction = authActionClient
  .metadata({ actionName: "send_webhook_test_event" })
  .inputSchema(sendWebhookTestEventSchema)
  .use(createRateLimitMiddleware(10, "1 m"))
  .action(async ({ ctx, parsedInput }) => {
    const { space } = await requireWebhookAccess();

    const result = await sendWebhookTestEvent({
      spaceId: space.id,
      webhookId: parsedInput.webhookId,
    });

    track(ctx.user, {
      event: "developer:webhook_test_send",
      properties: { ok: result.ok, status: result.status },
      groups: {
        space: space.id,
      },
    });

    return result;
  });
