"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { toast } from "@rallly/ui/sonner";
import { MailIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { LoginLink } from "@/components/login-link";
import { RegisterLink } from "@/components/register-link";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import type { InviteeRowStatus } from "@/features/poll/components/invitee-list";
import {
  InviteeListPreview,
  InviteeRow,
} from "@/features/poll/components/invitee-list";
import { sendPollInviteAction } from "@/features/poll/invite/actions";
import { sendPollInviteSchema } from "@/features/poll/invite/schema";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

type Row = {
  id: string;
  email: string;
  status: InviteeRowStatus;
  inviteUrl?: string;
};

// Same rule as the server, so a client accepted address is never refused
const inviteFormSchema = sendPollInviteSchema.pick({ email: true });
type InviteFormValues = { email: string };

/**
 * `invites` is server data passed down from the route; the send action's
 * success handler refreshes the route, which is what replaces an optimistic
 * "Sending" row with the real one.
 */
export function InviteByEmail({ invites }: { invites: PollInviteListItem[] }) {
  const poll = usePoll();
  const { user } = useUser();
  const isFree = useIsFree();
  const { t } = useTranslation();

  const isGuest = !user || user.isGuest;
  const isOpen = poll.status === "open";

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "" },
  });
  const [sending, setSending] = React.useState<string[]>([]);
  const [announcement, setAnnouncement] = React.useState("");
  const announceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const invitedEmails = React.useMemo(
    () => new Set(invites.map((invite) => invite.email.toLowerCase())),
    [invites],
  );

  // An optimistic row lives until the refreshed server list carries it.
  React.useEffect(() => {
    setSending((prev) => {
      const next = prev.filter((address) => !invitedEmails.has(address));
      return next.length === prev.length ? prev : next;
    });
  }, [invitedEmails]);

  const rows: Row[] = [
    ...sending
      .filter((address) => !invitedEmails.has(address))
      .map((address) => ({
        id: `sending:${address}`,
        email: address,
        status: "sending" as const,
      })),
    ...invites,
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

  const sendInvite = useSafeAction(sendPollInviteAction, {
    onSuccess: async ({ data, input }) => {
      if (!data) {
        setSending((prev) => prev.filter((address) => address !== input.email));
        return;
      }
      if (data.ok) {
        announce(
          t("shareDialogInviteSent", {
            defaultValue: "Invite sent to {email}",
            email: input.email,
          }),
        );
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
        form.setValue("email", input.email);
      }
    },
    onError: ({ input }) => {
      setSending((prev) => prev.filter((address) => address !== input.email));
      form.setValue("email", input.email);
    },
  });

  const onInvalid = () => {
    announce(
      t("shareDialogInvalidEmail", {
        defaultValue: "Enter a single valid email address",
      }),
    );
    form.setFocus("email");
  };

  const onValid = ({ email: address }: InviteFormValues) => {
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
      form.setFocus("email");
      return;
    }
    setSending((prev) => [address, ...prev]);
    form.reset();
    form.setFocus("email");
    sendInvite.execute({ pollId: poll.id, email: address });
  };

  return (
    <div className="min-w-0">
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
          <form
            onSubmit={form.handleSubmit(onValid, onInvalid)}
            className="flex min-w-0 gap-2"
            noValidate
          >
            <label htmlFor="share-dialog-email" className="sr-only">
              <Trans i18nKey="emailAddress" defaults="Email address" />
            </label>
            <InputGroup className="min-w-0 flex-1">
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
              <InputGroupInput
                {...form.register("email")}
                id="share-dialog-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="jessie.smith@example.com"
                disabled={!isOpen}
                aria-invalid={form.formState.errors.email ? true : undefined}
                aria-describedby={
                  isOpen ? undefined : "share-dialog-closed-reason"
                }
              />
            </InputGroup>
            <Button
              type="submit"
              variant="primary"
              disabled={!isOpen}
              aria-describedby={
                isOpen ? undefined : "share-dialog-closed-reason"
              }
            >
              <Trans i18nKey="shareDialogSendInvite" defaults="Send invite" />
              {isFree ? (
                <ProBadge className="ml-1.5 bg-primary-foreground/20 text-primary-foreground" />
              ) : null}
            </Button>
          </form>
          {!isOpen ? (
            <p
              id="share-dialog-closed-reason"
              className="mt-3 text-muted-foreground text-sm"
            >
              <Trans
                i18nKey="shareDialogPollClosed"
                defaults="Reopen the poll to send invites"
              />
            </p>
          ) : null}

          <div className="mt-3">
            {rows.length === 0 ? (
              <div className="relative mt-2">
                <InviteeListPreview />
                <EmptyState className="absolute inset-0 py-0 backdrop-blur-[2px]">
                  <EmptyStateIcon>
                    <MailIcon />
                  </EmptyStateIcon>
                  <EmptyStateTitle>
                    <Trans
                      i18nKey="shareDialogNoInvitesTitle"
                      defaults="No one invited yet"
                    />
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    <Trans
                      i18nKey="shareDialogNoInvitesDescription"
                      defaults="Enter an address above to send the first invite."
                    />
                  </EmptyStateDescription>
                </EmptyState>
              </div>
            ) : (
              <>
                <h4 id="share-dialog-invited-heading" className="sr-only">
                  {countLabel(rows.length)}
                </h4>
                <ul
                  aria-labelledby="share-dialog-invited-heading"
                  className="-mx-1.5 max-h-72 min-h-0 overflow-y-auto px-1.5"
                >
                  {rows.map((row) => (
                    <InviteeRow
                      key={row.id}
                      email={row.email}
                      status={row.status}
                      inviteId={row.inviteUrl ? row.id : undefined}
                      inviteUrl={row.inviteUrl}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
