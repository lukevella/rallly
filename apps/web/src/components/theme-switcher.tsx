"use client";

import { ButtonGroup, ButtonGroupItem } from "@rallly/ui/button-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "@/i18n/client";
import { useTheme } from "@/lib/theme";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  // next-themes reads localStorage during the first client render, which
  // the server can't know — show no selection until mounted so hydration
  // matches. The empty string (not undefined) keeps the group controlled
  // for its whole life.
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ButtonGroup
      aria-label={t("theme", { defaultValue: "Theme" })}
      value={isMounted ? (theme ?? "") : ""}
      onValueChange={setTheme}
    >
      <ButtonGroupItem
        value="system"
        className="px-2"
        aria-label={t("themeSystem", { defaultValue: "System" })}
      >
        <MonitorIcon className="size-4" />
      </ButtonGroupItem>
      <ButtonGroupItem
        value="light"
        className="px-2"
        aria-label={t("themeLight", { defaultValue: "Light" })}
      >
        <SunIcon className="size-4" />
      </ButtonGroupItem>
      <ButtonGroupItem
        value="dark"
        className="px-2"
        aria-label={t("themeDark", { defaultValue: "Dark" })}
      >
        <MoonIcon className="size-4" />
      </ButtonGroupItem>
    </ButtonGroup>
  );
}
