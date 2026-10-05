"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { StarIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/i18n/client";
import { reviewRequestUrl } from "../constants";

/**
 * Asks the user for a G2 review. The server decides eligibility and records
 * the ask, so this renders only when it should and only once per user.
 */
export function ReviewRequestCard() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 text-left">
      <div className="flex gap-3">
        <StarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm">
          <Trans
            i18nKey="reviewRequestDescription"
            defaults="Rallly is built by a small team. A two-minute review on G2 helps other teams find us."
          />
        </p>
      </div>
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
