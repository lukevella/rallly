import "server-only";

import { cache } from "react";
import { loadActiveSpace } from "@/features/space/loaders";
import {
  listSpaceInvites,
  listSpaceMembers,
} from "@/features/space/member/data";

export const loadSpaceMembers = cache(async () => {
  const space = await loadActiveSpace();
  return listSpaceMembers({ spaceId: space.id });
});

export const loadPendingInvites = cache(async () => {
  const space = await loadActiveSpace();
  return listSpaceInvites({ spaceId: space.id });
});
