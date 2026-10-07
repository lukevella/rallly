"use client";
import { cn } from "@rallly/ui";
import { badgeVariants } from "@rallly/ui/badge";
import { Trans } from "@/i18n/client";

export function LastUsedBadge() {
  return (
    <span
      className={cn(
        badgeVariants({ variant: "secondary", size: "sm" }),
        "absolute -top-2.5 right-3 bg-background ring-1 ring-primary/20",
      )}
    >
      <Trans i18nKey="lastUsedLoginMethod" defaults="Last used" />
    </span>
  );
}
