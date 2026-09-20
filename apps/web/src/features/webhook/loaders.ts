import "server-only";

import { cache } from "react";
import { getActiveSpace } from "@/features/space/loaders";
import { requireUser } from "@/features/user/loaders";
import { getSpaceWebhooks, getWebhookAccess } from "./data";

/**
 * Whether the signed-in user may manage webhooks in their active space, and
 * when they may not, whether upgrading would change that.
 */
export const loadWebhookAccess = cache(async () => {
  const [user, space] = await Promise.all([requireUser(), getActiveSpace()]);
  return getWebhookAccess(user, space);
});

export const loadSpaceWebhooks = cache(async () => {
  const space = await getActiveSpace();
  return getSpaceWebhooks({ spaceId: space.id });
});
