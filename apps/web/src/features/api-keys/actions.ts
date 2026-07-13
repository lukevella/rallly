"use server";

import { isApiAccessEnabled } from "@/features/api-keys/data";
import { createApiKey, revokeApiKey } from "@/features/api-keys/mutations";
import {
  createApiKeySchema,
  revokeApiKeySchema,
} from "@/features/api-keys/schema";
import { getActiveSpaceForUser } from "@/features/space/data";
import { AppError } from "@/lib/errors/app-error";
import { posthog } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

async function requireApiAccess(userId: string) {
  const space = await getActiveSpaceForUser(userId);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Space not found",
    });
  }

  const hasAccess = await isApiAccessEnabled({ id: userId }, space);

  if (!hasAccess) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "API access is not enabled for this user or space",
    });
  }

  return space;
}

export const createApiKeyAction = authActionClient
  .metadata({ actionName: "create_api_key" })
  .inputSchema(createApiKeySchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireApiAccess(ctx.user.id);

    const result = await createApiKey({
      spaceId: space.id,
      name: parsedInput.name,
    });

    if (result.ok) {
      posthog()?.capture({
        distinctId: ctx.user.id,
        event: "developer:api_key_create",
        groups: {
          space: space.id,
        },
      });
    }

    return result;
  });

export const revokeApiKeyAction = authActionClient
  .metadata({ actionName: "revoke_api_key" })
  .inputSchema(revokeApiKeySchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireApiAccess(ctx.user.id);

    await revokeApiKey({ spaceId: space.id, id: parsedInput.id });

    posthog()?.capture({
      distinctId: ctx.user.id,
      event: "developer:api_key_revoke",
      groups: {
        space: space.id,
      },
    });
  });
