import "server-only";

import { cache } from "react";
import { loadActiveSpace } from "@/features/space/loaders";
import { loadUser } from "@/features/user/loaders";
import { getSpaceWebhooks, getWebhookAccess } from "./data";

/**
 * Whether the signed-in user may manage webhooks in their active space, and
 * when they may not, whether upgrading would change that.
 */
export const loadWebhookAccess = cache(async () => {
  const [user, space] = await Promise.all([loadUser(), loadActiveSpace()]);
  return getWebhookAccess(user, space);
});

export const loadSpaceWebhooks = cache(async () => {
  const space = await loadActiveSpace();
  return getSpaceWebhooks({ spaceId: space.id });
});
