"use client";

import {
  ThemeProvider,
  useTheme as useNextTheme,
} from "@rallly/ui/theme-provider";
import React from "react";

export const useTheme = () => {
  const { theme, setTheme } = useNextTheme();

  return React.useMemo(
    () => ({
      theme,
      setTheme: (theme: string) => {
        setTheme(theme);
      },
    }),
    [theme, setTheme],
  );
};

export { ThemeProvider };
