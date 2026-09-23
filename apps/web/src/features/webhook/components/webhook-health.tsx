"use client";

import { Badge, badgeVariants } from "@rallly/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@rallly/ui/popover";
import { CircleCheckIcon, CircleXIcon, TriangleAlertIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { MAX_CONSECUTIVE_FAILURES, RETRY_DELAYS_MS } from "../constants";
import { getWebhookHealth } from "../utils";

const RETRY_WINDOW_HOURS = Math.ceil(
  RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0) / 3_600_000,
);

type LastAttempt = {
  status: "succeeded" | "failed" | "exhausted" | "pending" | "in_flight";
  lastResponseStatus: number | null;
  lastError: string | null;
  updatedAt: Date;
};

function LastAttemptDetails({ lastAttempt }: { lastAttempt?: LastAttempt }) {
  const { toRelativeTime } = useDateTime();

  if (!lastAttempt) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground">
        {lastAttempt.lastResponseStatus ? (
          <Trans
            i18nKey="webhookHealthLastAttemptWithStatus"
            defaults="Last attempt {date} returned {status}"
            values={{
              date: toRelativeTime(lastAttempt.updatedAt),
              status: lastAttempt.lastResponseStatus,
            }}
          />
        ) : (
          <Trans
            i18nKey="webhookHealthLastAttempt"
            defaults="Last attempt {date}"
            values={{ date: toRelativeTime(lastAttempt.updatedAt) }}
          />
        )}
      </p>
      {lastAttempt.lastError ? (
        <p className="break-words rounded-md bg-muted px-2 py-1.5 font-mono text-muted-foreground text-xs">
          {lastAttempt.lastError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * An endpoint's health in the settings list. An icon and its own words carry
 * the state; the color only reinforces it. The failure states open the last
 * error in place. An endpoint the owner switched off shows nothing: the
 * switch beside it already says so.
 */
export function WebhookHealth({
  enabled,
  consecutiveFailures,
  lastAttempt,
}: {
  enabled: boolean;
  consecutiveFailures: number;
  lastAttempt?: LastAttempt;
}) {
  const { toRelativeTime } = useDateTime();
  const health = getWebhookHealth({
    enabled,
    consecutiveFailures,
    lastAttempt,
  });

  switch (health) {
    case "disabled":
      return null;
    case "idle":
      return (
        <div className="text-muted-foreground text-sm">
          <Trans i18nKey="noDeliveriesYet" defaults="No deliveries yet" />
        </div>
      );
    case "healthy":
      return (
        <Badge variant="green">
          <CircleCheckIcon className="mr-1 size-3.5" />
          {lastAttempt ? (
            <Trans
              i18nKey="webhookLastDeliverySucceeded"
              defaults="Delivered {date}"
              values={{ date: toRelativeTime(lastAttempt.updatedAt) }}
            />
          ) : null}
        </Badge>
      );
    case "failing":
      return (
        <Popover>
          <PopoverTrigger
            className={badgeVariants({ variant: "amber" })}
            render={<button type="button" />}
          >
            <TriangleAlertIcon className="mr-1 size-3.5" />
            <Trans i18nKey="webhookHealthFailing" defaults="Failing" />
          </PopoverTrigger>
          <PopoverContent align="end">
            <PopoverHeader>
              <PopoverTitle>
                {consecutiveFailures > 0 ? (
                  <Trans
                    i18nKey="webhookHealthFailedInARow"
                    defaults="{count, plural, one {# event} other {# events}} failed in a row"
                    values={{ count: consecutiveFailures }}
                  />
                ) : (
                  <Trans
                    i18nKey="webhookHealthLastAttemptFailed"
                    defaults="Last attempt failed"
                  />
                )}
              </PopoverTitle>
            </PopoverHeader>
            <LastAttemptDetails lastAttempt={lastAttempt} />
            <PopoverDescription>
              <Trans
                i18nKey="webhookHealthRetryPolicy"
                defaults="Rallly retries each event for up to {hours} hours and turns the endpoint off after {count} events in a row fail."
                values={{
                  hours: RETRY_WINDOW_HOURS,
                  count: MAX_CONSECUTIVE_FAILURES,
                }}
              />
            </PopoverDescription>
          </PopoverContent>
        </Popover>
      );
    case "disabled_after_failures":
      return (
        <Popover>
          <PopoverTrigger
            className={badgeVariants({ variant: "destructive" })}
            render={<button type="button" />}
          >
            <CircleXIcon className="mr-1 size-3.5" />
            <Trans
              i18nKey="webhookHealthDisabledAfterFailures"
              defaults="Turned off after failures"
            />
          </PopoverTrigger>
          <PopoverContent align="end">
            <PopoverHeader>
              <PopoverTitle>
                <Trans
                  i18nKey="webhookHealthTurnedOffByRallly"
                  defaults="Turned off by Rallly"
                />
              </PopoverTitle>
              <PopoverDescription>
                <Trans
                  i18nKey="webhookHealthTurnedOffReason"
                  defaults="{count} events in a row failed."
                  values={{ count: consecutiveFailures }}
                />
              </PopoverDescription>
            </PopoverHeader>
            <LastAttemptDetails lastAttempt={lastAttempt} />
            <p className="text-muted-foreground">
              <Trans
                i18nKey="webhookHealthTurnBackOn"
                defaults="Turn it back on to resume. Events from while it was off are not delivered."
              />
            </p>
          </PopoverContent>
        </Popover>
      );
  }
}
