import "server-only";

import { cache } from "react";
import { getActiveSpace } from "@/features/space/loaders";
import {
  listSpaceInvites,
  listSpaceMembers,
} from "@/features/space/member/data";

export const loadSpaceMembers = cache(async () => {
  const space = await getActiveSpace();
  return listSpaceMembers({ spaceId: space.id });
});

export const loadPendingInvites = cache(async () => {
  const space = await getActiveSpace();
  return listSpaceInvites({ spaceId: space.id });
});
