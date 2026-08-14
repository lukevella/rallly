import "server-only";

import { cache } from "react";
import { env } from "@/env";
import { getInstanceSettings } from "@/features/instance-settings/data";
import { loadInstanceLicense } from "@/features/licensing/data";
import { isSelfHosted } from "@/lib/constants";
import { isMaintenanceModeEnabled } from "@/lib/maintenance";
import { resolveStorageUrl } from "@/lib/storage/resolve-storage-url";
import { getForegroundColor } from "@/lib/utils/color";
import type { BrandingConfig } from "./client";
import {
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
} from "./constants";
import { getPrimaryColorVars } from "./utils";

function getDefaultBrandingConfig(): BrandingConfig {
  return {
    primaryColor: getPrimaryColorVars(DEFAULT_PRIMARY_COLOR),
    logo: {
      light: DEFAULT_LOGO_URL,
      dark: DEFAULT_LOGO_URL_DARK,
    },
    logoIcon: DEFAULT_LOGO_ICON_URL,
    hideAttribution: false,
    appName: DEFAULT_APP_NAME,
  };
}

/**
 * Resolves each branding value with `db ?? env ?? default` precedence. Colors
 * are the raw stored hex values; logos are the raw stored values (either an
 * uploaded storage key or an absolute URL).
 */
export async function getBrandingSettings() {
  const settings = await getInstanceSettings();

  return {
    appName: settings.appName ?? env.APP_NAME ?? DEFAULT_APP_NAME,
    primaryColor: settings.primaryColor ?? env.PRIMARY_COLOR ?? null,
    primaryColorDark:
      settings.primaryColorDark ?? env.PRIMARY_COLOR_DARK ?? null,
    logoUrl: settings.logoUrl ?? env.LOGO_URL ?? null,
    logoUrlDark: settings.logoUrlDark ?? env.LOGO_URL_DARK ?? null,
    logoIconUrl: settings.logoIconUrl ?? env.LOGO_ICON_URL ?? null,
    hideAttribution:
      settings.hideAttribution ?? env.HIDE_ATTRIBUTION === "true",
  };
}

export async function getCustomBrandingConfig(): Promise<BrandingConfig> {
  const settings = await getBrandingSettings();

  const baseColor = settings.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const vars = getPrimaryColorVars(baseColor);
  const dark = settings.primaryColorDark ?? vars.dark;

  return {
    primaryColor: {
      light: vars.light,
      lightForeground: vars.lightForeground,
      dark,
      darkForeground: dark ? getForegroundColor(dark) : vars.darkForeground,
    },
    logo: {
      light: resolveStorageUrl(settings.logoUrl ?? DEFAULT_LOGO_URL),
      dark: resolveStorageUrl(
        settings.logoUrlDark ?? settings.logoUrl ?? DEFAULT_LOGO_URL_DARK,
      ),
    },
    logoIcon: resolveStorageUrl(settings.logoIconUrl ?? DEFAULT_LOGO_ICON_URL),
    hideAttribution: settings.hideAttribution,
    appName: settings.appName,
  };
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
