"use client";

import { Badge } from "@rallly/ui/badge";
import { Card, CardContent } from "@rallly/ui/card";
import { MapPinIcon, User2Icon } from "lucide-react";
import React from "react";
import { getPrimaryColorVars } from "@/features/branding/utils";
import {
  EventMetaItem,
  EventMetaList,
  EventMetaTitle,
} from "@/features/poll/components/event-meta";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { Trans } from "@/i18n/client";

// Taller than the card it frames: the card runs past the bottom edge and is
// cropped, which is what makes it read as a window onto a longer page. The
// extra height over the original 220 is top padding, so the same amount of
// card stays visible before the crop.
const PREVIEW_HEIGHT = 252;

/**
 * Approximates the poll invite card so the chosen color can be judged against
 * the surface it actually lands on. The branded variables are scoped to this
 * container rather than :root so they can't bleed into the settings chrome.
 *
 * The card is deliberately taller than the frame and cropped, with a fade at
 * the bottom edge, to read as a window onto a longer page rather than a
 * complete card whose content happens to be sparse.
 *
 * Sits in the SettingHint slot of the row whose switch controls it, so the
 * preview reads as evidence for that setting rather than a separate panel.
 */
export function BrandingPreview({
  spaceName,
  spaceImage,
  primaryColor,
  hostName,
}: {
  spaceName: string;
  spaceImage?: string | null;
  primaryColor: string;
  hostName: string;
}) {
  const vars = React.useMemo(
    () => getPrimaryColorVars(primaryColor),
    [primaryColor],
  );

  return (
    <div
      // The public page follows the viewer's theme, so both sets of values are
      // supplied and the dark variants swap them in.
      style={
        {
          "--primary": vars.light,
          "--primary-foreground": vars.lightForeground,
          "--preview-primary-dark": vars.dark,
          "--preview-primary-dark-foreground": vars.darkForeground,
          height: PREVIEW_HEIGHT,
        } as React.CSSProperties
      }
      className="relative overflow-hidden rounded-lg border bg-gray-100 px-4 pt-12 dark:bg-gray-900 dark:[--primary-foreground:var(--preview-primary-dark-foreground)] dark:[--primary:var(--preview-primary-dark)]"
    >
      <Badge className="absolute top-2.5 right-3 z-10" size="sm">
        <Trans i18nKey="preview" defaults="Preview" />
      </Badge>
      {/* Decorative: it restates settings already present as real controls */}
      <div className="mx-auto max-w-sm" aria-hidden="true">
        <Card>
          {/* The branded bar, mirroring RandomGradientBar on the real card */}
          <div className="-mx-px -mt-px h-2 rounded-t-2xl bg-linear-to-r from-primary to-primary/75" />
          <CardContent>
            <div className="mb-2">
              <SpaceIcon
                name={spaceName}
                src={spaceImage ?? undefined}
                size="xl"
              />
              <p className="mt-2 truncate font-medium text-muted-foreground text-sm">
                {spaceName}
              </p>
            </div>
            <EventMetaTitle>
              <Trans
                i18nKey="brandingPreviewEventTitle"
                defaults="Team Offsite"
              />
            </EventMetaTitle>
            <EventMetaList className="mt-4">
              <EventMetaItem>
                <User2Icon />
                <Trans
                  i18nKey="organizedBy"
                  defaults="Organized by {name}"
                  values={{ name: hostName }}
                />
              </EventMetaItem>
              <EventMetaItem>
                <MapPinIcon />
                <Trans
                  i18nKey="brandingPreviewLocation"
                  defaults="The Old Fire Station"
                />
              </EventMetaItem>
            </EventMetaList>
          </CardContent>
        </Card>
      </div>
      {/* Fades the cropped edge so the card reads as continuing below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-gray-100 dark:to-gray-900" />
    </div>
  );
}
