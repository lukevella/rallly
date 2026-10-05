"use client";

import { posthog } from "@rallly/posthog/client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { Button } from "@rallly/ui/button";
import React from "react";
import { Trans } from "@/i18n/client";
import { founderPhotoUrl, reviewRequestUrl } from "../constants";

/**
 * Asks the user for a G2 review, in the founder's own voice. The server
 * decides eligibility and records the ask, so this renders only when it
 * should and only once per user.
 */
export function ReviewRequestCard() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 text-left">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={founderPhotoUrl} alt="Luke Vella" />
          <AvatarFallback seed="Luke Vella">LV</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">Luke Vella</span>
          <span className="text-muted-foreground text-xs">
            <Trans
              i18nKey="reviewRequestFounderRole"
              defaults="Founder of Rallly"
            />
          </span>
        </div>
      </div>
      <p className="text-sm">
        <Trans
          i18nKey="reviewRequestMessage"
          defaults="If Rallly saved you some back-and-forth, would you leave a quick review on G2? It helps other people find us."
        />
      </p>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            posthog?.capture("review_request:dismiss_click", {
              channel: "in_app",
              destination: "g2",
            });
            setDismissed(true);
          }}
        >
          <Trans i18nKey="reviewRequestDismiss" defaults="Not now" />
        </Button>
        <Button
          size="sm"
          variant="primary"
          nativeButton={false}
          render={
            <a
              href={reviewRequestUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          onClick={() => {
            posthog?.capture("review_request:cta_click", {
              channel: "in_app",
              destination: "g2",
            });
            setDismissed(true);
          }}
        >
          <Trans i18nKey="reviewRequestCta" defaults="Write a review" />
        </Button>
      </div>
    </div>
  );
}
