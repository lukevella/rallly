"use client";

import { Button } from "@rallly/ui/button";
import { useTheme } from "@rallly/ui/theme-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { MoonIcon, SunIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "@/i18n/client";

/**
 * One button that flips between light and dark. The icon shows the current
 * theme: a sun in light mode, a moon in dark mode. It is chosen by the
 * `dark` class on the document, which is set before first paint, so the
 * server render needs no placeholder.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is only known in the browser; until then the
  // pressed state is left unset rather than guessed.
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const isDark = resolvedTheme === "dark";
  const label = t("themeToggleDarkMode", { defaultValue: "Dark mode" });

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={className}
            aria-label={label}
            aria-pressed={isMounted ? isDark : undefined}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
      </TooltipTrigger>
      <TooltipContent>
        {t("themeToggleTooltip", { defaultValue: "Switch theme" })}
      </TooltipContent>
    </Tooltip>
  );
}
