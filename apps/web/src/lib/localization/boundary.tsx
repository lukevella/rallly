import type React from "react";
import { LocalizationProvider } from "@/lib/localization/context";
import { getLocalization } from "@/lib/localization/server";

export async function LocalizationBoundary({
  children,
}: {
  children?: React.ReactNode;
}) {
  const initial = await getLocalization();

  return (
    <LocalizationProvider initial={initial}>{children}</LocalizationProvider>
  );
}
