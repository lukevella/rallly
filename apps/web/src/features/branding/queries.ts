import "server-only";

import { cache } from "react";
import { env } from "@/env";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getForegroundColor } from "@/utils/color";
import { isSelfHosted } from "@/utils/constants";
import type { BrandingConfig } from "./client";
import { getPrimaryColorVars } from "./color";
import {
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
} from "./constants";

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

export function getCustomBrandingConfig() {
  const baseColor = env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
  const vars = getPrimaryColorVars(baseColor);
  const dark = env.PRIMARY_COLOR_DARK ?? vars.dark;

  return {
    primaryColor: {
      light: vars.light,
      lightForeground: vars.lightForeground,
      dark,
      darkForeground: dark ? getForegroundColor(dark) : vars.darkForeground,
    },
    logo: {
      light: env.LOGO_URL ?? DEFAULT_LOGO_URL,
      dark: env.LOGO_URL_DARK ?? env.LOGO_URL ?? DEFAULT_LOGO_URL_DARK,
    },
    logoIcon: env.LOGO_ICON_URL ?? DEFAULT_LOGO_ICON_URL,
    hideAttribution: env.HIDE_ATTRIBUTION === "true",
    appName: env.APP_NAME ?? DEFAULT_APP_NAME,
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
  const license = await loadInstanceLicense();
  const hasWhiteLabelAddon = license?.whiteLabelAddon ?? false;
  return hasWhiteLabelAddon
    ? getCustomBrandingConfig()
    : getDefaultBrandingConfig();
});
