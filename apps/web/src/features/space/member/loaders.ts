import "server-only";

import { cache } from "react";
import { loadActiveSpace } from "@/features/space/loaders";
import {
  listMemberContentSummaries,
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
 * What each member created in the active space, for the remove member
 * dialog. Active events are measured against the viewer's present, so the
 * device zone decides, with the stored preference as the fallback.
 */
export const loadMemberContentSummaries = cache(async () => {
  const [user, space, deviceTimeZone] = await Promise.all([
    loadUser(),
    loadActiveSpace(),
    getDeviceTimeZone(),
  ]);

  return listMemberContentSummaries({
    spaceId: space.id,
    now: new Date(),
    timeZone: deviceTimeZone ?? normalizeTimeZone(user.timeZone) ?? "UTC",
  });
});
