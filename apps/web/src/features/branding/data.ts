import "server-only";

import { cache } from "react";
import { env } from "@/env";
import { getInstanceSettings } from "@/features/instance-settings/data";
import { loadInstanceLicense } from "@/features/licensing/data";
import { isSelfHosted } from "@/lib/constants";
import { isMaintenanceModeEnabled } from "@/lib/maintenance";
import { resolveBrandingConfig } from "./utils";

function getDefaultBrandingConfig() {
  return resolveBrandingConfig({});
}

function getEnvBrandingValues() {
  return {
    appName: env.APP_NAME,
    primaryColor: env.PRIMARY_COLOR,
    primaryColorDark: env.PRIMARY_COLOR_DARK,
    logo: env.LOGO_URL,
    logoDark: env.LOGO_URL_DARK,
    logoIcon: env.LOGO_ICON_URL,
    logoHeight: env.LOGO_HEIGHT,
    hideAttribution: env.HIDE_ATTRIBUTION === "true",
  };
}

export async function getCustomBrandingConfig() {
  // Cloud keeps the env-only path; maintenance mode keeps skipping the
  // database so the maintenance page can render while it's unreachable
  const db =
    isSelfHosted && !isMaintenanceModeEnabled()
      ? await getInstanceSettings()
      : null;

  return resolveBrandingConfig({ db, env: getEnvBrandingValues() });
}

/**
 * Returns the branding config for the current instance.
 * Automatically checks if the white label addon is enabled and returns
 * the appropriate config (custom or default).
 */
export const getInstanceBrandingConfig = cache(async () => {
  if (!isSelfHosted) {
    return getCustomBrandingConfig();
  }
  if (isMaintenanceModeEnabled()) {
    // Skip the license lookup so the maintenance page can render while the
    // database is unreachable
    return getDefaultBrandingConfig();
  }
  const license = await loadInstanceLicense();
  const hasWhiteLabelAddon = license?.whiteLabelAddon ?? false;
  return hasWhiteLabelAddon
    ? getCustomBrandingConfig()
    : getDefaultBrandingConfig();
});
