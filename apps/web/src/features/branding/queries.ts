import "server-only";

import type React from "react";
import { env } from "@/env";
import { loadInstanceLicense } from "@/features/licensing/data";
import { adjustColorForContrast, getForegroundColor } from "@/utils/color";
import {
  DARK_MODE_BACKGROUND,
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
  LIGHT_MODE_BACKGROUND,
} from "./constants";

export function getPrimaryColor() {
  const baseColor = env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
  const light = adjustColorForContrast(baseColor, LIGHT_MODE_BACKGROUND);
  const dark =
    env.PRIMARY_COLOR_DARK ??
    adjustColorForContrast(baseColor, DARK_MODE_BACKGROUND);

  return {
    light,
    dark,
  };
}

export function getAppName() {
  return env.APP_NAME ?? DEFAULT_APP_NAME;
}

export async function getBrandingCssProperties() {
  const { light, dark } = getPrimaryColor();

  return {
    "--primary-light": light,
    "--primary-light-foreground": getForegroundColor(light),
    "--primary-dark": dark,
    "--primary-dark-foreground": getForegroundColor(dark),
  } as React.CSSProperties;
}

export function getLogoUrl() {
  return {
    light: env.LOGO_URL ?? DEFAULT_LOGO_URL,
    dark: env.LOGO_URL_DARK ?? env.LOGO_URL ?? DEFAULT_LOGO_URL_DARK,
  };
}

export function getLogoIconUrl() {
  return env.LOGO_ICON_URL ?? DEFAULT_LOGO_ICON_URL;
}

export function getHidePoweredBy() {
  // This function is called synchronously in feature flag config,
  // so we need to check the license synchronously
  // The actual license check will be done at runtime when needed
  return env.HIDE_POWERED_BY === "true";
}

export async function shouldHidePoweredBy() {
  const license = await loadInstanceLicense();
  const hasWhiteLabelAddon = !!license?.whiteLabelAddon;

  // Only hide if both the env var is set and the user has white-label add-on
  if (!hasWhiteLabelAddon) {
    return false;
  }

  return env.HIDE_POWERED_BY === "true";
}
