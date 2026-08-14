import "server-only";

import { cache } from "react";
import { requireAdmin } from "@/features/user/loaders";
import { getBrandingSettings } from "./data";

export const loadBrandingSettings = cache(async () => {
  await requireAdmin();
  return getBrandingSettings();
});
