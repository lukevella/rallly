"use server";

import { isApiAccessEnabled } from "@/features/api-keys/data";
import { createApiKey, revokeApiKey } from "@/features/api-keys/mutations";
import {
  createApiKeySchema,
  revokeApiKeySchema,
} from "@/features/api-keys/schema";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getCurrentUser } from "@/features/user/loaders";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

// The UI never offers these actions to users without API access, so a
// failed gate is unexpected here — throw for the global error handler.
async function requireApiAccess() {
  const user = await getCurrentUser();

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

  if (!(await isApiAccessEnabled(user, space))) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "API access is not enabled for this user or space",
    });
  }

  return { user, space };
}

export const createApiKeyAction = authActionClient
  .metadata({ actionName: "create_api_key" })
  .inputSchema(createApiKeySchema)
  .action(async ({ ctx, parsedInput }) => {
    const { space } = await requireApiAccess();

    const result = await createApiKey({
      spaceId: space.id,
      name: parsedInput.name,
    });

    if (result.ok) {
      track(ctx.user, {
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
    const { space } = await requireApiAccess();

    await revokeApiKey({ spaceId: space.id, id: parsedInput.id });

    track(ctx.user, {
      event: "developer:api_key_revoke",
      groups: {
        space: space.id,
      },
    });
  });
