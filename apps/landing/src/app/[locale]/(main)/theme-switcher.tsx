"use client";

import { ButtonGroup, ButtonGroupItem } from "@rallly/ui/button-group";
import { useTheme } from "@rallly/ui/theme-provider";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import React from "react";

export function ThemeSwitcher({
  label,
  systemLabel,
  lightLabel,
  darkLabel,
}: {
  label: string;
  systemLabel: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const { theme, setTheme } = useTheme();
  // next-themes reads localStorage during the first client render, which the
  // static page can't know, so show no selection until mounted. The empty
  // string keeps the group controlled for its whole life.
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ButtonGroup
      aria-label={label}
      value={isMounted ? (theme ?? "") : ""}
      onValueChange={setTheme}
    >
      <ButtonGroupItem value="system" className="px-2" aria-label={systemLabel}>
        <MonitorIcon className="size-4" />
      </ButtonGroupItem>
      <ButtonGroupItem value="light" className="px-2" aria-label={lightLabel}>
        <SunIcon className="size-4" />
      </ButtonGroupItem>
      <ButtonGroupItem value="dark" className="px-2" aria-label={darkLabel}>
        <MoonIcon className="size-4" />
      </ButtonGroupItem>
    </ButtonGroup>
  );
}
