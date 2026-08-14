import { resolveStorageUrl } from "@/lib/storage/resolve-storage-url";
import { adjustColorForContrast, getForegroundColor } from "@/lib/utils/color";
import type { BrandingConfig } from "./client";
import {
  DARK_MODE_BACKGROUND,
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
  LIGHT_MODE_BACKGROUND,
  MAX_LOGO_HEIGHT,
  MIN_LOGO_HEIGHT,
} from "./constants";

export function getPrimaryColorVars(primaryColor: string) {
  const light = adjustColorForContrast(primaryColor, LIGHT_MODE_BACKGROUND);
  const dark = adjustColorForContrast(primaryColor, DARK_MODE_BACKGROUND);
  return {
    light,
    lightForeground: getForegroundColor(light),
    dark,
    darkForeground: getForegroundColor(dark),
  };
}

export function clampLogoHeight(height: number) {
  return Math.min(MAX_LOGO_HEIGHT, Math.max(MIN_LOGO_HEIGHT, height));
}

interface BrandingValues {
  appName?: string | null;
  primaryColor?: string | null;
  primaryColorDark?: string | null;
  logo?: string | null;
  logoDark?: string | null;
  logoIcon?: string | null;
  logoHeight?: number | null;
  hideAttribution?: boolean | null;
}

/**
 * Merges branding values per field (db → env → default), then applies the
 * derived rules: dark logo falls back to the light logo, the dark primary
 * color is computed from the light one, and foreground colors are computed
 * from their backgrounds. Logo values may be storage keys or absolute URLs.
 * Logo height has no env var — it is configured in the UI only.
 */
export function resolveBrandingConfig({
  db,
  env,
}: {
  db?: BrandingValues | null;
  env?: Omit<BrandingValues, "logoHeight">;
}): BrandingConfig {
  const primaryColor =
    db?.primaryColor ?? env?.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const vars = getPrimaryColorVars(primaryColor);
  const primaryColorDark =
    db?.primaryColorDark ?? env?.primaryColorDark ?? vars.dark;

  const logo = db?.logo ?? env?.logo ?? null;
  const logoDark = db?.logoDark ?? env?.logoDark ?? logo;

  return {
    primaryColor: {
      light: vars.light,
      lightForeground: vars.lightForeground,
      dark: primaryColorDark,
      darkForeground: getForegroundColor(primaryColorDark),
    },
    logo: {
      light: resolveStorageUrl(logo ?? DEFAULT_LOGO_URL),
      dark: resolveStorageUrl(logoDark ?? DEFAULT_LOGO_URL_DARK),
    },
    logoIcon: resolveStorageUrl(
      db?.logoIcon ?? env?.logoIcon ?? DEFAULT_LOGO_ICON_URL,
    ),
    logoHeight: clampLogoHeight(db?.logoHeight ?? DEFAULT_LOGO_HEIGHT),
    hideAttribution: db?.hideAttribution ?? env?.hideAttribution ?? false,
    appName: db?.appName ?? env?.appName ?? DEFAULT_APP_NAME,
  };
}
