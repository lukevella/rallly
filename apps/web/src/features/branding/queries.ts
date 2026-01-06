import "server-only";

import { env } from "@/env";
import { adjustColorForContrast } from "@/utils/color";
import type { BrandingConfig } from "./client";
import {
  DARK_MODE_BACKGROUND,
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
  LIGHT_MODE_BACKGROUND,
} from "./constants";

export function getDefaultBrandingConfig(): BrandingConfig {
  const baseColor = DEFAULT_PRIMARY_COLOR;
  const light = adjustColorForContrast(baseColor, LIGHT_MODE_BACKGROUND);
  const dark = adjustColorForContrast(baseColor, DARK_MODE_BACKGROUND);

  return {
    primaryColor: {
      light,
      dark,
    },
    logo: {
      light: DEFAULT_LOGO_URL,
      dark: DEFAULT_LOGO_URL_DARK,
    },
    logoIcon: DEFAULT_LOGO_ICON_URL,
    hideAttribution: false,
    appName: DEFAULT_APP_NAME,
  };
}

export async function getBrandingConfig() {
  const baseColor = env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
  const light = adjustColorForContrast(baseColor, LIGHT_MODE_BACKGROUND);
  const dark =
    env.PRIMARY_COLOR_DARK ??
    adjustColorForContrast(baseColor, DARK_MODE_BACKGROUND);

  return {
    primaryColor: {
      light,
      dark,
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
