import "server-only";

import { cache } from "react";
import { getActiveSpace } from "@/features/space/loaders";
import { requireUser } from "@/features/user/loaders";
import { getSpaceWebhooks, isWebhooksEnabled } from "./data";

/**
 * Whether the signed-in user may manage webhooks in their active space.
 * The page decides what a `false` means: the hobby tier gets the upgrade
 * screen, every other reason is a 404.
 */
export const loadWebhooksEnabled = cache(async () => {
  const [user, space] = await Promise.all([requireUser(), getActiveSpace()]);
  return isWebhooksEnabled(user, space);
});

export const loadSpaceWebhooks = cache(async () => {
  const space = await getActiveSpace();
  return getSpaceWebhooks({ spaceId: space.id });
});
