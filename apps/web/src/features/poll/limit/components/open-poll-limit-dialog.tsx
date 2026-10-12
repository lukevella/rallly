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
import { BarChart2Icon } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { Link } from "@/components/link";
import { LoginLink } from "@/components/login-link";
import { PageIcon } from "@/components/page-icons";
import { primePayWall, usePayWallStore } from "@/features/billing/client";
import { PayWallDialog } from "@/features/billing/components/pay-wall-dialog";
import { PLAN_NAMES } from "@/features/billing/constants";
import type { OpenPollLimitSource } from "@/features/poll/limit/client";
import { useOpenPollLimitStore } from "@/features/poll/limit/client";
import type { OpenPollUsage } from "@/features/poll/limit/types";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Single, app-wide instance. Open it from anywhere with
 * `showOpenPollLimit()`.
 */
export function OpenPollLimitDialog() {
  const isOpen = useOpenPollLimitStore((state) => state.isOpen);
  const content = useOpenPollLimitStore((state) => state.content);
  const hide = useOpenPollLimitStore((state) => state.hide);
  // A refused reopen or duplicate leaves the organizer on a page that still
  // works, so it can be dismissed. On /new there is nothing left to do but
  // make room, register or upgrade, so the only ways out are its own links.
  const dismissible = content !== null && content.source !== "create";

  // The dialog's links close it by leaving the page, which keeps it up if
  // that navigation fails or is cancelled. Each layout mounts its own
  // instance, so one on another page must never open, even for a moment.
  const pathname = usePathname();
  const isOnOpeningPage = content !== null && content.pathname === pathname;
  React.useEffect(() => {
    if (isOpen && !isOnOpeningPage) {
      hide();
    }
  }, [isOpen, isOnOpeningPage, hide]);

  return (
    <Dialog
      open={isOpen && isOnOpeningPage}
      disablePointerDismissal={!dismissible}
      onOpenChange={(open) => {
        if (!open && dismissible) {
          hide();
        }
      }}
    >
      <DialogContent size="md" showCloseButton={dismissible}>
        {content ? (
          <OpenPollLimitContent source={content.source} usage={content.usage} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function OpenPollLimitContent({
  source,
  usage: data,
}: {
  source: OpenPollLimitSource;
  usage: OpenPollUsage;
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
        <div className="flex items-center gap-3">
          <PageIcon size="sm" color="primary">
            <BarChart2Icon />
          </PageIcon>
          <DialogTitle>
            <Trans
              i18nKey="openPollLimitReachedTitle"
              defaults="Open poll limit reached"
            />
          </DialogTitle>
        </div>
        <DialogDescription className="mt-2">
          {data.tier === "guest" ? (
            <Trans
              i18nKey="openPollLimitGuestDescription"
              defaults="Guests can have one open poll at a time. Finalize or close polls to make room, or log in to increase your limit."
            />
          ) : (
            <Trans
              i18nKey="openPollLimitFreeDescription"
              defaults="{planName} includes up to {limit} open polls at a time. Finalize or close polls to make room, or upgrade for unlimited open polls."
              values={{ planName: PLAN_NAMES.HOBBY, limit: data.limit }}
            />
          )}
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
            }}
          >
            <Trans i18nKey="goToPolls" defaults="Go to polls" />
          </Link>
        ) : null}
        <OpenPollLimitActions
          usage={data}
          onRegisterClick={() => {
            posthog?.capture("poll_limit:register_click", eventProperties);
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
