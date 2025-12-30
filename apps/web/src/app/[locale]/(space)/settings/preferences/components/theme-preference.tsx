"use client";

import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/components/trans";
import { useTheme } from "@/features/theme/client";

const themes = [
  { value: "system", icon: MonitorIcon },
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
] as const;

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
      className="flex aspect-video flex-1 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-card-accent has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-linear-to-b has-data-[state=checked]:from-primary/10 has-data-[state=checked]:to-primary/5 has-data-[state=checked]:ring-primary [&>svg]:size-5"
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-2">
        {themes.map(({ value }) => (
          <div
            key={value}
            className="h-20 w-24 animate-pulse rounded-lg bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      value={theme}
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
