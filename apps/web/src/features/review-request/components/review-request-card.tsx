"use client";

import { posthog } from "@rallly/posthog/client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import { Button } from "@rallly/ui/button";
import { XIcon } from "lucide-react";
import React from "react";
import { Trans, useTranslation } from "@/i18n/client";
import { founderPhotoUrl, reviewRequestUrl } from "../constants";

/**
 * Asks the user for a G2 review as a short note signed by the founder. The
 * server decides eligibility and records the ask, so this renders only when
 * it should and only once per user.
 */
export function ReviewRequestCard() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-4 rounded-lg border bg-gray-50 p-5 text-left text-sm">
      <Button
        size="icon-sm"
        variant="ghost"
        className="absolute top-2 right-2"
        aria-label={t("reviewRequestClose", { defaultValue: "Dismiss" })}
        onClick={() => {
          posthog?.capture("review_request:dismiss_click", {
            channel: "in_app",
            destination: "g2",
          });
          setDismissed(true);
        }}
      >
        <XIcon />
      </Button>
      <p>
        <Trans i18nKey="reviewRequestGreeting" defaults="Hey there," />
      </p>
      <p>
        <Trans
          i18nKey="reviewRequestMessage"
          defaults="If Rallly saved you some back-and-forth, would you leave a quick review on G2? It helps other people find us."
        />
      </p>
      <div>
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
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={founderPhotoUrl} alt="Luke Vella" />
          <AvatarFallback seed="Luke Vella">LV</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">Luke Vella</span>
          <span className="text-muted-foreground text-xs">
            <Trans
              i18nKey="reviewRequestFounderRole"
              defaults="Founder of Rallly"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
