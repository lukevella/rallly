import "server-only";

import { cache } from "react";
import { countLiveEventsByHost } from "@/features/scheduled-event/data";
import { loadActiveSpace } from "@/features/space/loaders";
import {
  listSpaceInvites,
  listSpaceMembers,
} from "@/features/space/member/data";
import { loadUser } from "@/features/user/loaders";
import { getDeviceTimeZone } from "@/lib/datetime/server";
import { normalizeTimeZone } from "@/lib/datetime/utils";

export const loadSpaceMembers = cache(async () => {
  const space = await loadActiveSpace();
  return listSpaceMembers({ spaceId: space.id });
});

export const loadPendingInvites = cache(async () => {
  const space = await loadActiveSpace();
  return listSpaceInvites({ spaceId: space.id });
});

/**
 * Live events per host in the active space, for the members page. Lives
 * here rather than in scheduled-event for the same reason as
 * loadUpcomingEventCount in space/loaders.ts: space → scheduled-event is
 * the forward edge.
 */
export const loadLiveEventCountsByHost = cache(async () => {
  const [user, space, deviceTimeZone] = await Promise.all([
    loadUser(),
    loadActiveSpace(),
    getDeviceTimeZone(),
  ]);

  // Live is measured against the viewer's present, so the device zone wins;
  // the stored preference is a fallback for devices whose zone cookie hasn't
  // been set yet.
  const timeZone = deviceTimeZone ?? normalizeTimeZone(user.timeZone) ?? "UTC";

  return countLiveEventsByHost({
    spaceId: space.id,
    now: new Date(),
    timeZone,
  });
});
