"use client";

import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import {
  LinkIcon,
  MailIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";
import { useCopyToClipboard } from "react-use";
import { Spinner } from "@/components/spinner";
import { usePoll } from "@/features/poll/client";
import { revokePollInviteAction } from "@/features/poll/invite/actions";
import type { PollInviteStatus } from "@/features/poll/invite/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export type InviteeRowStatus = PollInviteStatus | "sending";

export function InviteeStatusPill({ status }: { status: InviteeRowStatus }) {
  if (status === "sending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center">
        <Spinner className="size-4" />
        <span className="sr-only">
          <Trans i18nKey="inviteStatusSending" defaults="Sending" />
        </span>
      </span>
    );
  }

  const label = {
    sent: <Trans i18nKey="inviteStatusSent" defaults="Sent" />,
    opened: <Trans i18nKey="inviteStatusOpened" defaults="Opened" />,
    responded: <Trans i18nKey="inviteStatusResponded" defaults="Responded" />,
  }[status];

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 font-medium text-xs",
        status === "responded" &&
          "bg-green-500/10 text-green-700 dark:text-green-400",
        status === "opened" && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
        status === "sent" &&
          "bg-white text-muted-foreground ring-1 ring-black/10 ring-inset dark:bg-white/10 dark:ring-white/10",
      )}
    >
      {label}
    </span>
  );
}

/**
 * The per invitee link is the only thing that joins a response to its
 * invite, so a host who reaches someone through another channel copies
 * this rather than the generic invite link. Removing is offered only while
 * the invite is pending: a converted one belongs to the response.
 */
function InviteeRowMenu({
  inviteId,
  email,
  status,
  inviteUrl,
}: {
  inviteId: string;
  email: string;
  status: PollInviteStatus;
  inviteUrl: string;
}) {
  const poll = usePoll();
  const { t } = useTranslation();
  const [state, copyToClipboard] = useCopyToClipboard();

  // The success handler refreshes the route, which is what drops the row.
  const revoke = useSafeAction(revokePollInviteAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      if (data.ok) {
        toast(
          t("shareDialogInviteRemoved", {
            defaultValue: "Invite for {email} removed",
            email,
          }),
        );
        return;
      }
      toast.error(
        data.reason === "alreadyResponded"
          ? t("shareDialogAlreadyResponded", {
              defaultValue: "{email} has already responded",
              email,
            })
          : t("actionErrorNotFound", {
              defaultValue: "The resource was not found",
            }),
      );
    },
  });

  // react-use records a failed copy as `error` and a successful one as
  // `value`; the toast only claims success in the second case.
  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
      toast.error(
        t("shareDialogCopyFailed", {
          defaultValue: "Couldn't copy the link. Try again.",
        }),
      );
      return;
    }
    if (state.value) {
      toast(
        t("shareDialogPersonalLinkCopied", {
          defaultValue: "Personal link for {email} copied",
          email,
        }),
      );
      posthog?.capture("poll_share:invitee_link_copy", {
        poll_id: poll.id,
        status,
      });
    }
  }, [state, email, status, poll.id, t]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={t("inviteeRowOptions", {
              defaultValue: "Options for {email}",
              email,
            })}
            variant="ghost"
            size="icon"
            className="shrink-0"
          />
        }
      >
        <MoreHorizontalIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => copyToClipboard(inviteUrl)}>
          <LinkIcon />
          <Trans
            i18nKey="shareDialogCopyPersonalLink"
            defaults="Copy personal link"
          />
        </DropdownMenuItem>
        {status !== "responded" ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={revoke.isPending}
            onClick={() => revoke.execute({ pollId: poll.id, inviteId })}
          >
            <Trash2Icon />
            <Trans i18nKey="shareDialogRemoveInvite" defaults="Remove invite" />
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InviteeRow({
  inviteId,
  email,
  status,
  inviteUrl,
}: {
  email: string;
  status: InviteeRowStatus;
  // Both absent while the invite is still sending and on preview rows.
  inviteId?: string;
  inviteUrl?: string;
}) {
  return (
    <li className="flex h-11 items-center gap-2.5 rounded-lg px-1.5 hover:bg-accent has-[:focus-visible]:bg-accent">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-muted-foreground ring-1 ring-black/10 ring-inset dark:bg-white/10 dark:ring-white/10"
      >
        <MailIcon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
      <InviteeStatusPill status={status} />
      {status !== "sending" && inviteId && inviteUrl ? (
        <InviteeRowMenu
          inviteId={inviteId}
          email={email}
          status={status}
          inviteUrl={inviteUrl}
        />
      ) : null}
    </li>
  );
}

const PREVIEW_ROWS: { email: string; status: InviteeRowStatus }[] = [
  { email: "jessie@example.com", status: "responded" },
  { email: "michael@example.com", status: "opened" },
  { email: "priya@example.com", status: "sent" },
  { email: "tomas@example.com", status: "sent" },
];

/**
 * A faded, inert sample list rendered behind the empty state so the section
 * shows what it will look like before anyone is invited.
 */
export function InviteeListPreview() {
  return (
    <ul
      aria-hidden="true"
      inert
      className="pointer-events-none select-none [mask-image:radial-gradient(ellipse_at_center,transparent,rgba(0,0,0,0.1))]"
    >
      {PREVIEW_ROWS.map((row) => (
        <InviteeRow key={row.email} email={row.email} status={row.status} />
      ))}
    </ul>
  );
}
