"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@rallly/ui/popover";
import React from "react";
import { LoginLink } from "@/components/login-link";
import { showPayWall } from "@/features/billing/client";
import { FREE_OPEN_POLL_LIMIT } from "@/features/billing/constants";
import { OpenPollUsageBar } from "@/features/poll/limit/components/open-poll-usage-bar";
import type { OpenPollUsage } from "@/features/poll/limit/types";
import {
  isAtOpenPollLimit,
  isNearOpenPollLimit,
} from "@/features/poll/limit/utils";
import { Trans, useTranslation } from "@/i18n/client";

function UsageDonut({
  value,
  isAtLimit,
}: {
  value: number;
  isAtLimit: boolean;
}) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r={radius}
        fill="none"
        strokeWidth="2.5"
        className="stroke-gray-100 dark:stroke-gray-800"
      />
      <circle
        cx="8"
        cy="8"
        r={radius}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(value, 1))}
        className={cn(isAtLimit ? "stroke-destructive" : "stroke-green-500")}
      />
    </svg>
  );
}

export function OpenPollUsageMeter({ usage }: { usage: OpenPollUsage }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  if (usage.limit === null || !isNearOpenPollLimit(usage)) {
    return null;
  }

  const eventProperties = {
    tier: usage.tier,
    open_count: usage.openCount,
    limit: usage.limit,
    source: "meter",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" />}
        onClick={() => {
          posthog?.capture("poll_limit:meter_click", eventProperties);
        }}
      >
        <UsageDonut
          value={usage.openCount / usage.limit}
          isAtLimit={isAtOpenPollLimit(usage)}
        />
        <span className="tabular-nums">
          {t("openPollUsageButton", {
            defaultValue:
              "{limit, plural, one {{openCount} of # open poll} other {{openCount} of # open polls}}",
            openCount: usage.openCount,
            limit: usage.limit,
          })}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-4">
        <div className="space-y-2">
          <OpenPollUsageBar
            openCount={usage.openCount}
            limit={usage.limit}
            label={
              <PopoverTitle render={<span />}>
                <Trans i18nKey="openPolls" defaults="Open polls" />
              </PopoverTitle>
            }
          />
          <PopoverDescription>
            {usage.tier === "guest" ? (
              <Trans
                i18nKey="openPollUsageGuestHint"
                defaults="Guests can have {limit} open poll at a time. Create an account to have up to {freeLimit}."
                values={{ limit: usage.limit, freeLimit: FREE_OPEN_POLL_LIMIT }}
              />
            ) : isAtOpenPollLimit(usage) ? (
              <Trans
                i18nKey="openPollUsageAtLimitHint"
                defaults="Finalize or close a poll to create a new one, or upgrade for unlimited open polls."
              />
            ) : (
              <Trans
                i18nKey="openPollUsageHint"
                defaults="Your plan allows up to {limit} open polls at a time."
                values={{ limit: usage.limit }}
              />
            )}
          </PopoverDescription>
        </div>
        {usage.tier === "guest" ? (
          <LoginLink
            className={cn(buttonVariants({ size: "sm" }), "self-start")}
            onClick={() => {
              posthog?.capture("poll_limit:register_click", eventProperties);
            }}
          >
            <Trans i18nKey="createAnAccount" defaults="Create an account" />
          </LoginLink>
        ) : usage.tier === "hobby" ? (
          <Button
            size="sm"
            className="self-start"
            onClick={() => {
              posthog?.capture("poll_limit:upgrade_click", eventProperties);
              setOpen(false);
              showPayWall({ from: "poll-limit-meter" });
            }}
          >
            <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
