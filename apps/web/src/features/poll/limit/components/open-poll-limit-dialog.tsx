"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Progress } from "@rallly/ui/progress";
import React from "react";
import { Link } from "@/components/link";
import { LoginLink } from "@/components/login-link";
import { primePayWall, usePayWallStore } from "@/features/billing/client";
import { PayWallDialog } from "@/features/billing/components/pay-wall-dialog";
import type { OpenPollLimitSource } from "@/features/poll/limit/client";
import { useOpenPollLimitStore } from "@/features/poll/limit/client";
import type { OpenPollUsage } from "@/features/poll/limit/types";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Single, app-wide instance. Open it from anywhere with
 * `showOpenPollLimit()`.
 */
export function OpenPollLimitDialog() {
  const open = useOpenPollLimitStore((state) => state.open);
  const hide = useOpenPollLimitStore((state) => state.hide);
  // A refused reopen leaves the organizer on a page that still works, so it
  // can be dismissed. On /new there is nothing left to do but make room,
  // register or upgrade, so the only ways out are the dialog's own links.
  const dismissible = open?.source === "reopen";

  return (
    <Dialog
      open={open !== null}
      disablePointerDismissal={!dismissible}
      onOpenChange={(open) => {
        if (!open && dismissible) {
          hide();
        }
      }}
    >
      <DialogContent size="md" showCloseButton={dismissible}>
        {open ? (
          <OpenPollLimitContent
            source={open.source}
            usage={open.usage}
            onDismiss={hide}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function OpenPollLimitContent({
  source,
  usage: data,
  onDismiss,
}: {
  source: OpenPollLimitSource;
  usage: OpenPollUsage;
  onDismiss: () => void;
}) {
  // The pay wall nests here so it stacks above this dialog and this dialog
  // is still there when the pay wall closes.
  const payWall = useDialog();
  const payWallPricing = usePayWallStore((state) => state.pricing);

  const eventProperties = React.useMemo(
    () => ({
      tier: data.tier,
      open_count: data.openCount,
      limit: data.limit,
      source,
    }),
    [data, source],
  );

  React.useEffect(() => {
    posthog?.capture("poll_limit:wall_view", eventProperties);
  }, [eventProperties]);

  if (data.limit === null) {
    return null;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <Trans i18nKey="openPollLimitTitle" defaults="Open poll limit" />
        </DialogTitle>
        <DialogDescription>
          <Trans
            i18nKey="openPollLimitDescription"
            defaults="You have hit the limit of open polls for your current tier."
          />
        </DialogDescription>
      </DialogHeader>
      <OpenPollUsageBar openCount={data.openCount} limit={data.limit} />
      <DialogFooter>
        {data.tier !== "guest" ? (
          <Link
            href="/polls"
            className={buttonVariants()}
            onClick={() => {
              posthog?.capture("poll_limit:go_to_polls_click", eventProperties);
              onDismiss();
            }}
          >
            <Trans i18nKey="goToPolls" defaults="Go to polls" />
          </Link>
        ) : null}
        <OpenPollLimitActions
          usage={data}
          onRegisterClick={() => {
            posthog?.capture("poll_limit:register_click", eventProperties);
            onDismiss();
          }}
          onUpgradeClick={() => {
            posthog?.capture("poll_limit:upgrade_click", eventProperties);
            primePayWall({ from: "poll-limit" });
            payWall.trigger();
          }}
        />
      </DialogFooter>
      <PayWallDialog
        pricing={payWallPricing}
        isOpen={payWall.dialogProps.open}
        onOpenChange={payWall.dialogProps.onOpenChange}
      />
    </>
  );
}

function OpenPollUsageBar({
  openCount,
  limit,
}: {
  openCount: number;
  limit: number;
}) {
  const { t } = useTranslation();
  const isAtLimit = openCount >= limit;
  const usageText = t("openPollLimitUsage", {
    defaultValue: "{openCount} of {limit}",
    openCount,
    limit,
  });
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">
          <Trans i18nKey="openPolls" defaults="Open polls" />
        </span>
        <span
          className={cn(
            "text-muted-foreground tabular-nums",
            isAtLimit && "text-destructive",
          )}
        >
          {usageText}
        </span>
      </div>
      <Progress
        value={Math.min((openCount / limit) * 100, 100)}
        aria-label={t("openPolls", { defaultValue: "Open polls" })}
        getAriaValueText={() => usageText}
        className="h-2"
        indicatorClassName={cn(isAtLimit && "bg-destructive bg-none")}
      />
    </div>
  );
}

function OpenPollLimitActions({
  usage,
  onRegisterClick,
  onUpgradeClick,
}: {
  usage: OpenPollUsage;
  onRegisterClick: () => void;
  onUpgradeClick: () => void;
}) {
  if (usage.tier === "guest") {
    return (
      <LoginLink
        className={buttonVariants({ variant: "primary" })}
        onClick={onRegisterClick}
      >
        <Trans i18nKey="logInOrSignUp" defaults="Log in or sign up" />
      </LoginLink>
    );
  }

  if (usage.tier === "hobby") {
    return (
      <Button variant="primary" onClick={onUpgradeClick}>
        <Trans i18nKey="upgrade" defaults="Upgrade" />
      </Button>
    );
  }

  return null;
}
