"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { MailIcon, XIcon } from "lucide-react";
import React from "react";
import { LoginLink } from "@/components/login-link";
import { RegisterLink } from "@/components/register-link";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import {
  revokePollInviteAction,
  sendPollInviteAction,
} from "@/features/poll/invite/actions";
import type { PollInviteStatus } from "@/features/poll/invite/utils";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";

type Row = {
  id: string;
  email: string;
  status: PollInviteStatus | "sending";
};

const emailPattern = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

function StatusPill({ status }: { status: Row["status"] }) {
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
          "bg-muted text-muted-foreground",
        status === "sending" && "italic",
      )}
    >
      {label}
    </span>
  );
}

export function InviteByEmail() {
  const poll = usePoll();
  const { user } = useUser();
  const isFree = useIsFree();
  const { t } = useTranslation();
  const queryClient = trpc.useUtils();

  const isGuest = !user || user.isGuest;
  const isOpen = poll.status === "open";

  const invites = trpc.polls.invites.list.useQuery(
    { pollId: poll.id },
    { enabled: !isGuest },
  );

  const [email, setEmail] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const [sending, setSending] = React.useState<string[]>([]);
  const [revoking, setRevoking] = React.useState<string[]>([]);
  const [announcement, setAnnouncement] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = React.useState<
    { kind: "row"; id: string } | { kind: "field" } | null
  >(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const announceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const rows: Row[] = [
    ...sending.map((address) => ({
      id: `sending:${address}`,
      email: address,
      status: "sending" as const,
    })),
    ...(invites.data ?? []),
  ];

  const announce = (message: string) => {
    if (announceTimeout.current) {
      clearTimeout(announceTimeout.current);
    }
    setAnnouncement("");
    announceTimeout.current = setTimeout(() => setAnnouncement(message), 30);
  };

  React.useEffect(
    () => () => {
      if (announceTimeout.current) {
        clearTimeout(announceTimeout.current);
      }
    },
    [],
  );

  const countLabel = (count: number) =>
    t("shareDialogInvitedCount", {
      defaultValue: "{count, plural, one {# invited} other {# invited}}",
      count,
    });

  const focusRowElement = (id: string) => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-row-id="${CSS.escape(id)}"]`,
    );
    if (!el) return false;
    el.focus();
    el.closest("li")?.scrollIntoView({ block: "nearest" });
    return true;
  };

  // An effect with no dependency array, not a callback: the row we want to
  // focus after a revoke only exists once the refetched list has re-rendered,
  // so this has to retry on every render until the target shows up.
  React.useEffect(() => {
    if (!pendingFocus) return;
    if (pendingFocus.kind === "row") {
      if (focusRowElement(pendingFocus.id)) {
        setActiveId(pendingFocus.id);
        setPendingFocus(null);
        return;
      }
      if (rows.some((row) => row.id === pendingFocus.id)) return;
      inputRef.current?.focus();
      setPendingFocus(null);
      return;
    }
    inputRef.current?.focus();
    setPendingFocus(null);
  });

  const sendInvite = useSafeAction(sendPollInviteAction, {
    onSuccess: async ({ data, input }) => {
      if (!data) {
        setSending((prev) => prev.filter((address) => address !== input.email));
        return;
      }
      if (data.ok) {
        await queryClient.polls.invites.list.invalidate({ pollId: poll.id });
        const fresh = queryClient.polls.invites.list.getData({
          pollId: poll.id,
        });
        announce(
          t("shareDialogInviteSentAnnouncement", {
            defaultValue: "Invite sent to {email}. {count}",
            email: input.email,
            count: countLabel(fresh?.length ?? 0),
          }),
        );
        setSending((prev) => prev.filter((address) => address !== input.email));
        return;
      }
      setSending((prev) => prev.filter((address) => address !== input.email));
      const messages = {
        alreadyInvited: t("shareDialogAlreadyInvited", {
          defaultValue: "{email} is already invited",
          email: input.email,
        }),
        alreadyResponded: t("shareDialogAlreadyResponded", {
          defaultValue: "{email} has already responded",
          email: input.email,
        }),
        dailyLimit: t("shareDialogDailyLimit", {
          defaultValue: "You've reached today's limit of 100 invites",
        }),
        pollClosed: t("shareDialogPollClosed", {
          defaultValue: "Reopen the poll to send invites",
        }),
        sendFailed: t("shareDialogSendFailed", {
          defaultValue: "Couldn't send to {email}. Try again.",
          email: input.email,
        }),
        notFound: t("actionErrorNotFound", {
          defaultValue: "The resource was not found",
        }),
        paymentRequired: t("actionErrorPaymentRequired", {
          defaultValue: "You need to upgrade to perform this action",
        }),
      };
      toast.error(messages[data.reason]);
      announce(messages[data.reason]);
      if (data.reason === "sendFailed") {
        setEmail(input.email);
      }
    },
    onError: ({ input }) => {
      setSending((prev) => prev.filter((address) => address !== input.email));
      setEmail(input.email);
    },
  });

  const revokeInvite = useSafeAction(revokePollInviteAction, {
    onSuccess: async ({ data, input }) => {
      const row = rows.find((candidate) => candidate.id === input.inviteId);
      if (!data?.ok) {
        setRevoking((prev) => prev.filter((id) => id !== input.inviteId));
        setPendingFocus(null);
        const message = t("shareDialogRevokeFailed", {
          defaultValue: "Couldn't revoke that invite. Try again.",
        });
        toast.error(message);
        announce(message);
        return;
      }
      await queryClient.polls.invites.list.invalidate({ pollId: poll.id });
      const fresh = queryClient.polls.invites.list.getData({ pollId: poll.id });
      announce(
        t("shareDialogInviteRevokedAnnouncement", {
          defaultValue: "Invite for {email} revoked. {count}",
          email: row?.email ?? "",
          count: countLabel(fresh?.length ?? 0),
        }),
      );
      setRevoking((prev) => prev.filter((id) => id !== input.inviteId));
    },
    onError: ({ input }) => {
      setRevoking((prev) => prev.filter((id) => id !== input.inviteId));
      setPendingFocus(null);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) {
      inputRef.current?.focus();
      return;
    }
    if (!emailPattern.test(address)) {
      setInvalid(true);
      announce(
        t("shareDialogInvalidEmail", {
          defaultValue: "Enter a single valid email address",
        }),
      );
      inputRef.current?.focus();
      return;
    }
    if (isFree) {
      showPayWall({ from: "invite-dialog", pollId: poll.id });
      return;
    }
    if (rows.some((row) => row.email.toLowerCase() === address)) {
      const message = t("shareDialogAlreadyInvited", {
        defaultValue: "{email} is already invited",
        email: address,
      });
      toast(message);
      announce(message);
      inputRef.current?.select();
      return;
    }
    setSending((prev) => [address, ...prev]);
    setEmail("");
    setInvalid(false);
    inputRef.current?.focus();
    sendInvite.execute({ pollId: poll.id, email: address });
  };

  const focusRow = (index: number) => {
    const target = rows[Math.max(0, Math.min(index, rows.length - 1))];
    if (!target) {
      inputRef.current?.focus();
      return;
    }
    setActiveId(target.id);
    focusRowElement(target.id);
  };

  const handleRevoke = (row: Row) => {
    const invited = invites.data ?? [];
    const index = invited.findIndex((invite) => invite.id === row.id);
    const next = invited[index + 1] ?? invited[index - 1];
    setPendingFocus(next ? { kind: "row", id: next.id } : { kind: "field" });
    setRevoking((prev) => [...prev, row.id]);
    revokeInvite.execute({ pollId: poll.id, inviteId: row.id });
  };

  const handleListKeyDown = (
    event: React.KeyboardEvent,
    row: Row,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusRow(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusRow(0);
        break;
      case "End":
        event.preventDefault();
        focusRow(rows.length - 1);
        break;
      case "Delete":
      case "Backspace":
        if (row.status === "sent" || row.status === "opened") {
          event.preventDefault();
          handleRevoke(row);
        }
        break;
    }
  };

  const activeRowId = rows.some((row) => row.id === activeId)
    ? activeId
    : (rows[0]?.id ?? null);

  return (
    <section aria-labelledby="share-dialog-email-heading" className="space-y-3">
      <h3 id="share-dialog-email-heading" className="font-semibold text-sm">
        <Trans i18nKey="shareDialogInviteByEmail" defaults="Invite by email" />
      </h3>

      {isGuest ? (
        <div className="space-y-2 rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground">
            <Trans
              i18nKey="shareDialogGuestPrompt"
              defaults="Create an account to invite people by email. Your invites and their responses stay attached to your account instead of this browser."
            />
          </p>
          <div className="flex gap-2">
            <RegisterLink className="underline hover:text-foreground">
              <Trans i18nKey="createAnAccount" defaults="Create an account" />
            </RegisterLink>
            <LoginLink className="underline hover:text-foreground">
              <Trans i18nKey="login" defaults="Login" />
            </LoginLink>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
            <label htmlFor="share-dialog-email" className="sr-only">
              <Trans i18nKey="emailAddress" defaults="Email address" />
            </label>
            <Input
              ref={inputRef}
              id="share-dialog-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder={t("emailAddress", { defaultValue: "Email address" })}
              value={email}
              disabled={!isOpen}
              aria-invalid={invalid || undefined}
              aria-describedby={
                isOpen ? undefined : "share-dialog-closed-reason"
              }
              onChange={(event) => {
                setEmail(event.target.value);
                setInvalid(false);
              }}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!isOpen}
              aria-describedby={
                isOpen ? undefined : "share-dialog-closed-reason"
              }
            >
              <Trans i18nKey="shareDialogSendInvite" defaults="Send invite" />
              {isFree ? <ProBadge className="ml-1.5" /> : null}
            </Button>
          </form>
          {!isOpen ? (
            <p
              id="share-dialog-closed-reason"
              className="text-muted-foreground text-sm"
            >
              <Trans
                i18nKey="shareDialogPollClosed"
                defaults="Reopen the poll to send invites"
              />
            </p>
          ) : null}

          <div className="space-y-1.5">
            <h4
              id="share-dialog-invited-heading"
              className="text-muted-foreground text-sm tabular-nums"
            >
              {countLabel(rows.length)}
            </h4>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
                <Trans
                  i18nKey="shareDialogNoInvites"
                  defaults="No one invited yet. Enter an address above to send the first invite."
                />
              </p>
            ) : (
              <ul
                ref={listRef}
                aria-labelledby="share-dialog-invited-heading"
                className="-mx-1.5 max-h-72 min-h-0 overflow-y-auto px-1.5"
              >
                {rows.map((row, index) => {
                  const revocable =
                    row.status === "sent" || row.status === "opened";
                  const tabIndex = row.id === activeRowId ? 0 : -1;
                  return (
                    <li
                      key={row.id}
                      className="flex h-11 items-center gap-2.5 rounded-lg px-1.5 hover:bg-accent has-[:focus-visible]:bg-accent"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                      >
                        <MailIcon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {row.email}
                      </span>
                      <StatusPill status={row.status} />
                      {revocable ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          tabIndex={tabIndex}
                          data-row-id={row.id}
                          disabled={revoking.includes(row.id)}
                          aria-label={t("shareDialogRevokeInvite", {
                            defaultValue: "Revoke invite for {email}",
                            email: row.email,
                          })}
                          onFocus={() => setActiveId(row.id)}
                          onKeyDown={(event) =>
                            handleListKeyDown(event, row, index)
                          }
                          onClick={() => handleRevoke(row)}
                        >
                          <XIcon />
                        </Button>
                      ) : (
                        <span
                          role="note"
                          tabIndex={tabIndex}
                          data-row-id={row.id}
                          aria-label={`${row.email}, ${row.status}`}
                          className="size-7 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
                          onFocus={() => setActiveId(row.id)}
                          onKeyDown={(event) =>
                            handleListKeyDown(event, row, index)
                          }
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
