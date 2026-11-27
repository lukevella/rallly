"use client";

import { buttonVariants } from "@rallly/ui";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import copy from "copy-to-clipboard";
import {
  CalendarCheckIcon,
  ExternalLinkIcon,
  LinkIcon,
  LockIcon,
  PlayIcon,
  ShareIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { AddToCalendarButton } from "@/features/calendars/components/add-to-calendar-button";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import {
  getOpenPollLimitRefusal,
  showOpenPollLimit,
} from "@/features/poll/limit/client";
import type { PollStatus } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { trpc } from "@/trpc/client";

/** The vote page link and the ways to share it, under an alert when the poll is closed or scheduled. */
export function PollStatusCard({
  pollId,
  status,
  inviteLink,
  event,
  floating,
}: {
  pollId: string;
  status: PollStatus;
  inviteLink: string;
  event: { id: string; start: Date; duration: number } | null;
  /** Times stored as UTC wall time: an all-day event or a floating poll. */
  floating: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {status === "closed" ? (
        <Alert>
          <LockIcon aria-hidden="true" />
          <AlertTitle>
            <Trans
              i18nKey="pollStatusAlertClosed"
              defaults="This poll is closed"
            />
          </AlertTitle>
          <AlertDescription>
            <Trans
              i18nKey="pollStatusAlertClosedDescription"
              defaults="Participants can't add or change their responses."
            />
          </AlertDescription>
          <AlertAction>
            <ReopenButton pollId={pollId} />
          </AlertAction>
        </Alert>
      ) : status === "scheduled" && event ? (
        <Alert variant="primary">
          <CalendarCheckIcon aria-hidden="true" />
          <AlertTitle>
            <Trans
              i18nKey="pollStatusAlertScheduled"
              defaults="Scheduled for <date />"
              components={{
                date: <EventDate event={event} floating={floating} />,
              }}
            />
          </AlertTitle>
          <AlertDescription>
            <Trans
              i18nKey="pollStatusAlertScheduledDescription"
              defaults="Participants can no longer change their responses."
            />
          </AlertDescription>
          <AlertAction>
            <AddToCalendarButton eventId={event.id} />
          </AlertAction>
        </Alert>
      ) : null}
      <StatusCard
        inviteLink={inviteLink}
        actions={
          <>
            <CopyLinkButton inviteLink={inviteLink} />
            <ShareButton
              pollId={pollId}
              pollStatus={status}
              inviteLink={inviteLink}
            />
            <ViewInvitePageButton inviteLink={inviteLink} />
          </>
        }
      />
    </div>
  );
}

function StatusCard({
  inviteLink,
  actions,
}: {
  inviteLink: string;
  actions: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-black/5 shadow-lg ring-1 ring-button-outline ring-inset dark:bg-foreground/5 dark:shadow-black/20 dark:shadow-md">
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="shrink-0">
            <Trans i18nKey="pollStatusCardInviteLink" defaults="Invite link:" />
          </span>
          <a
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-muted-foreground text-sm hover:text-foreground hover:underline"
          >
            {inviteLink.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      </div>
    </section>
  );
}

function EventDate({
  event,
  floating,
}: {
  event: { start: Date; duration: number };
  floating: boolean;
}) {
  const { formatDateTime } = useDateTime();
  const zone = event.duration === 0 || floating ? { timeZone: "UTC" } : {};
  const date = formatDateTime(event.start, "weekdayMonthDay", zone);
  const time =
    event.duration === 0 ? null : formatDateTime(event.start, "time", zone);
  return <>{time ? `${date}, ${time}` : date}</>;
}

/** An icon button whose accessible label also shows as a tooltip. */
function IconAction({
  label,
  render,
  children,
}: {
  label: string;
  render: React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={render}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ReopenButton({ pollId }: { pollId: string }) {
  const router = useRouter();
  // The page is server rendered, so the new status shows once it refreshes.
  const reopenPoll = trpc.polls.reopen.useMutation({
    onSuccess: (res) => {
      const refusal = getOpenPollLimitRefusal(res);
      if (refusal) {
        showOpenPollLimit("reopen", refusal.usage);
        return;
      }
      router.refresh();
    },
  });
  return (
    <Button
      loading={reopenPoll.isPending}
      onClick={() => reopenPoll.mutate({ pollId })}
    >
      <PlayIcon data-icon="inline-start" aria-hidden="true" />
      <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
    </Button>
  );
}

function CopyLinkButton({ inviteLink }: { inviteLink: string }) {
  const { t } = useTranslation();
  const label = t("copyLink", { defaultValue: "Copy link" });
  return (
    <IconAction
      label={label}
      render={
        <Button
          aria-label={label}
          size="icon"
          onClick={() => {
            if (copy(inviteLink)) {
              toast.success(t("linkCopied", { defaultValue: "Link copied" }));
            }
          }}
        />
      }
    >
      <LinkIcon aria-hidden="true" />
    </IconAction>
  );
}

function ShareButton({
  pollId,
  pollStatus,
  inviteLink,
}: {
  pollId: string;
  pollStatus: PollStatus;
  inviteLink: string;
}) {
  const share = useSharePollDialog(pollId);
  return (
    <>
      <Button onClick={() => share.open("manual")}>
        <ShareIcon data-icon="inline-start" aria-hidden="true" />
        <Trans i18nKey="share" defaults="Share" />
      </Button>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={pollId}
        pollStatus={pollStatus}
        inviteLink={inviteLink}
      />
    </>
  );
}

/** Opens the page participants see, in a new tab. */
function ViewInvitePageButton({ inviteLink }: { inviteLink: string }) {
  return (
    <a
      href={inviteLink}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "primary" })}
    >
      <Trans
        i18nKey="pollStatusCardViewInvitePage"
        defaults="View invite page"
      />
      <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
    </a>
  );
}
