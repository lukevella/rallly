"use client";

import React from "react";
import { getPrimaryColorVars } from "@/features/branding/utils";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";

/**
 * Approximates the public event page so the chosen color can be judged against
 * the surfaces it actually lands on. The branded variables are scoped to this
 * container rather than :root so they can't bleed into the settings chrome.
 */
export function BrandingPreview({
  spaceName,
  spaceImage,
  primaryColor,
}: {
  spaceName: string;
  spaceImage?: string | null;
  primaryColor: string;
}) {
  const vars = React.useMemo(
    () => getPrimaryColorVars(primaryColor),
    [primaryColor],
  );

  return (
    <div
      // The preview mirrors the public page, which follows the viewer's theme,
      // so both light and dark values are supplied and CSS picks per scheme.
      style={
        {
          "--primary": vars.light,
          "--primary-foreground": vars.lightForeground,
          "--preview-primary-dark": vars.dark,
          "--preview-primary-dark-foreground": vars.darkForeground,
        } as React.CSSProperties
      }
      className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900 dark:[--primary-foreground:var(--preview-primary-dark-foreground)] dark:[--primary:var(--preview-primary-dark)]"
    >
      <div className="mx-auto max-w-sm rounded-lg border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-x-2">
          <SpaceIcon name={spaceName} src={spaceImage ?? undefined} size="sm" />
          <span className="truncate font-medium text-sm">{spaceName}</span>
        </div>
        <div className="mt-3 font-semibold text-base">
          <Trans i18nKey="brandingPreviewEventTitle" defaults="Team Offsite" />
        </div>
        <div className="mt-0.5 text-muted-foreground text-xs">
          <Trans
            i18nKey="brandingPreviewEventDate"
            defaults="Friday, November 14 at 2:00 PM"
          />
        </div>
        {/* Styled to match a primary button without being focusable — the
            preview is illustrative, not interactive. */}
        <div className="mt-4 w-full rounded-lg bg-primary py-2 text-center font-medium text-primary-foreground text-sm">
          <Trans i18nKey="brandingPreviewCta" defaults="Register" />
        </div>
      </div>
    </div>
  );
}
