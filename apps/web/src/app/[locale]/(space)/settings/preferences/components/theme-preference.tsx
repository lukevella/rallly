"use client";

import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import React from "react";
import { Trans, useTranslation } from "@/i18n/client";
import { useTheme } from "@/lib/theme";

function ThemeOption({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label
      key={value}
      className="flex aspect-video flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-card-border bg-card p-4 transition-colors hover:bg-card-accent has-data-checked:border-primary/50 has-data-checked:bg-linear-to-b has-data-checked:from-primary/10 has-data-checked:to-primary/5 has-data-checked:ring-primary [&>svg]:size-5"
      htmlFor={value}
    >
      <RadioGroupItem value={value} id={value} className="peer sr-only" />
      {children}
    </label>
  );
}

function ThemeOptionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm">{children}</span>;
}

export function ThemePreference() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    // Base UI locks in uncontrolled mode when value is undefined on first
    // render, so remount the group once the theme is known after hydration
    <RadioGroup
      key={mounted ? "mounted" : "ssr"}
      aria-label={t("theme", { defaultValue: "Theme" })}
      value={mounted ? theme : undefined}
      onValueChange={setTheme}
      className="flex flex-wrap gap-2"
    >
      <ThemeOption value="system">
        <MonitorIcon />
        <ThemeOptionLabel>
          <Trans i18nKey="themeSystem" defaults="System" />
        </ThemeOptionLabel>
      </ThemeOption>
      <ThemeOption value="light">
        <SunIcon />
        <ThemeOptionLabel>
          <Trans i18nKey="themeLight" defaults="Light" />
        </ThemeOptionLabel>
      </ThemeOption>
      <ThemeOption value="dark">
        <MoonIcon />
        <ThemeOptionLabel>
          <Trans i18nKey="themeDark" defaults="Dark" />
        </ThemeOptionLabel>
      </ThemeOption>
    </RadioGroup>
  );
}
