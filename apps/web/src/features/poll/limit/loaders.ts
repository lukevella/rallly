import "server-only";

import { cache } from "react";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getSessionState } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { getOpenPollLimitDetails, getOpenPollUsage } from "./data";
import { getOpenPollTier, isAtOpenPollLimit } from "./utils";

/**
 * The session organizer's open poll usage in the scope they create into: a
 * guest's polls without a space, a member's in their active space. The polls
 * are listed only at the limit, where the dialog shows them. Null without a
 * session or an active space.
 */
export const loadOptionalOpenPollLimit = cache(async () => {
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

  const scope = { userId: user.id, spaceId: space?.id ?? null };
  const usage = await getOpenPollUsage({
    ...scope,
    tier: getOpenPollTier(space?.tier ?? null),
  });

  return isAtOpenPollLimit(usage)
    ? getOpenPollLimitDetails({ ...scope, usage })
    : { usage, polls: [] };
});
