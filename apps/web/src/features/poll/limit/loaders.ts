import "server-only";

import { cache } from "react";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getSessionState } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { isOpenPollLimitEnabled } from "./constants";
import { getOpenPollUsage } from "./data";
import { getOpenPollTier } from "./utils";

/**
 * The session organizer's open poll usage in the scope they create into: a
 * guest's polls without a space, a member's in their active space. Null
 * without a session or an active space, or while the limit is off.
 */
export const loadOptionalOpenPollUsage = cache(async () => {
  if (!isOpenPollLimitEnabled) {
    return null;
  }

  const state = await getSessionState();

  if (state.status !== "authenticated") {
    return null;
  }

  const { user } = state.session;

  if (user.banned) {
    throw new InvalidSessionError();
  }

  const space = user.isGuest ? null : await getActiveSpaceForUser(user.id);

  if (!user.isGuest && !space) {
    return null;
  }

  return getOpenPollUsage({
    userId: user.id,
    spaceId: space?.id ?? null,
    tier: getOpenPollTier(space?.tier ?? null),
  });
});
