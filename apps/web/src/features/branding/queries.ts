import "server-only";

import type React from "react";
import { env } from "@/env";
import { adjustColorForContrast, getForegroundColor } from "@/utils/color";
import {
  DARK_MODE_BACKGROUND,
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_PRIMARY_COLOR,
  LIGHT_MODE_BACKGROUND,
} from "./constants";

export function getPrimaryColor() {
  return env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
}

export function getAppName() {
  return env.APP_NAME ?? DEFAULT_APP_NAME;
}

export async function getBrandingCssProperties() {
  const primaryColor = getPrimaryColor();

  const primaryColorLight = adjustColorForContrast(
    primaryColor,
    LIGHT_MODE_BACKGROUND,
  );

  const primaryColorDark =
    env.PRIMARY_COLOR_DARK ??
    adjustColorForContrast(primaryColor, DARK_MODE_BACKGROUND);

  return {
    "--primary-light": primaryColorLight,
    "--primary-light-foreground": getForegroundColor(primaryColorLight),
    "--primary-dark": primaryColorDark,
    "--primary-dark-foreground": getForegroundColor(primaryColorDark),
  } as React.CSSProperties;
}

export function getLogoUrl() {
  return env.LOGO_URL ?? DEFAULT_LOGO_URL;
}

export function getLogoIconUrl() {
  return env.LOGO_ICON_URL ?? DEFAULT_LOGO_ICON_URL;
}
