import "server-only";

import { cache } from "react";
import { getNonprofitStatus } from "@/features/billing/nonprofit/data";
import { loadActiveSpace } from "@/features/space/loaders";

export const loadNonprofitStatus = cache(async () => {
  const space = await loadActiveSpace();
  return getNonprofitStatus(space.id);
});
