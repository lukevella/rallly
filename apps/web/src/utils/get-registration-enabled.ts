import "server-only";

import { getInstanceSettings } from "@/features/instance-settings/queries";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

export async function getRegistrationEnabled() {
  if (!isFeatureEnabled("registration")) {
    return false;
  }
  const instanceSettings = await getInstanceSettings();

  return !instanceSettings.disableUserRegistration;
}
