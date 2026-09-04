"use client";

import { cn } from "@rallly/ui";
import { MailIcon } from "lucide-react";
import type { PollInviteStatus } from "@/features/poll/invite/utils";
import { Trans } from "@/i18n/client";

export type InviteeRowStatus = PollInviteStatus | "sending";

export function InviteeStatusPill({ status }: { status: InviteeRowStatus }) {
  const label = {
    sent: <Trans i18nKey="inviteStatusSent" defaults="Sent" />,
    opened: <Trans i18nKey="inviteStatusOpened" defaults="Opened" />,
    responded: <Trans i18nKey="inviteStatusResponded" defaults="Responded" />,
    sending: <Trans i18nKey="inviteStatusSending" defaults="Sending" />,
  }[status];

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 font-medium text-xs",
        status === "responded" &&
          "bg-green-500/10 text-green-700 dark:text-green-400",
        status === "opened" && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
        (status === "sent" || status === "sending") &&
          "bg-white text-muted-foreground ring-1 ring-black/10 ring-inset dark:bg-white/10 dark:ring-white/10",
        status === "sending" && "italic",
      )}
    >
      {label}
    </span>
  );
}

/**
 * One invited person. `children` is the trailing action slot (a revoke
 * button, or a focusable spacer for rows without one).
 */
export function InviteeRow({
  email,
  status,
  children,
}: {
  email: string;
  status: InviteeRowStatus;
  children?: React.ReactNode;
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
      {children}
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
        <InviteeRow key={row.email} email={row.email} status={row.status}>
          <span className="size-7 shrink-0" />
        </InviteeRow>
      ))}
    </ul>
  );
}
