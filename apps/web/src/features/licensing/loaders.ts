import "server-only";

import { cache } from "react";
import { requireAdmin } from "@/features/user/loaders";
import { getWhiteLabelAddon } from "./data";

export const loadWhiteLabelAddon = cache(async () => {
  await requireAdmin();
  return getWhiteLabelAddon();
});
