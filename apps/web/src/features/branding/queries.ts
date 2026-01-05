import "server-only";

import type React from "react";
import { env } from "@/env";
import { adjustColorForContrast, getForegroundColor } from "@/utils/color";
import {
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_PRIMARY_COLOR,
} from "./constants";

export function getPrimaryColor() {
  return env.PRIMARY_COLOR ?? DEFAULT_PRIMARY_COLOR;
}

export function getAppName() {
  return env.APP_NAME ?? DEFAULT_APP_NAME;
}

export async function getBrandingCssProperties() {
  const primaryColor = getPrimaryColor();

  const lightModeBackground = "#ffffff";
  const darkModeBackground = "#171717";

  const primaryColorLight = adjustColorForContrast(
    primaryColor,
    lightModeBackground,
  );

  const primaryColorDark = adjustColorForContrast(
    primaryColor,
    darkModeBackground,
  );

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
