import "server-only";

import { cache } from "react";
import { env } from "@/env";
import { getInstanceSettings } from "@/features/instance-settings/data";
import { loadInstanceLicense } from "@/features/licensing/data";
import { DEFAULT_PRIMARY_COLOR } from "./constants";
import { getCustomBrandingConfig, isSpaceBrandingAllowed } from "./data";
import { getPrimaryColorVars } from "./utils";

export const loadSpaceBrandingAllowed = cache(() => isSpaceBrandingAllowed());

/**
 * Raw branding values for the control panel branding page. Editable fields
 * expose the stored value (db, then env, then default) rather than the
 * contrast-adjusted output of `resolveBrandingConfig`, so inputs reflect
 * what will be saved. `envConfigured` marks fields that are driven by an
 * environment variable because no database value has been set yet.
 */
export const loadBrandingSettings = cache(async () => {
  const [license, db, resolved] = await Promise.all([
    loadInstanceLicense(),
    getInstanceSettings(),
    getCustomBrandingConfig(),
  ]);

  const primaryColor =
    db.primaryColor ?? env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
  const primaryColorDark =
    db.primaryColorDark ??
    env.PRIMARY_COLOR_DARK ??
    getPrimaryColorVars(primaryColor).dark;

  return {
    hasWhiteLabelAddon: license?.whiteLabelAddon ?? false,
    appName: db.appName ?? env.APP_NAME,
    primaryColor,
    primaryColorDark,
    hideAttribution: db.hideAttribution ?? env.HIDE_ATTRIBUTION === "true",
    logoUrlLight: resolved.logo.light,
    logoUrlDark: resolved.logo.dark,
    logoIconUrl: resolved.logoIcon,
    // A stored value exists that can be removed to fall back to env/default
    logoConfigured: {
      logo: db.logo !== null,
      logoDark: db.logoDark !== null,
      logoIcon: db.logoIcon !== null,
    },
    // Checked against process.env because the parsed env applies defaults
    // (APP_NAME, HIDE_ATTRIBUTION), which would read as operator-set
    envConfigured: {
      appName: db.appName === null && Boolean(process.env.APP_NAME),
      primaryColor:
        db.primaryColor === null && Boolean(process.env.PRIMARY_COLOR),
      primaryColorDark:
        db.primaryColorDark === null && Boolean(process.env.PRIMARY_COLOR_DARK),
      hideAttribution:
        db.hideAttribution === null && Boolean(process.env.HIDE_ATTRIBUTION),
      logo: db.logo === null && Boolean(process.env.LOGO_URL),
      logoDark: db.logoDark === null && Boolean(process.env.LOGO_URL_DARK),
      logoIcon: db.logoIcon === null && Boolean(process.env.LOGO_ICON_URL),
    },
  };
});
