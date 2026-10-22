"use client";

import { Button } from "@rallly/ui/button";
import { MailIcon, MailOpenIcon, UserPlusIcon } from "lucide-react";
import { usePoll } from "@/features/poll/client";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { Trans } from "@/i18n/client";

const MAX_PENDING = 5;

type Invite = {
  id: string;
  email: string;
  opened: boolean;
  responded: boolean;
};

/**
 * Who has been invited by email and who the host is still waiting on: how
 * many responded, then only the invitees who haven't.
 */
export function InviteesCard({ invites }: { invites: Invite[] }) {
  const poll = usePoll();
  const share = useSharePollDialog(poll.id);
  const respondedCount = invites.filter((invite) => invite.responded).length;
  const pending = invites.filter((invite) => !invite.responded);
  const canInvite = poll.status === "open";

  return (
    <section className="rounded-[18px] border border-card-border bg-card p-5 text-sm">
      <div className="mb-3 flex h-6 items-center justify-between gap-4">
        <h2 className="font-medium">
          <Trans i18nKey="invitees" defaults="Invitees" />
        </h2>
        {invites.length > 0 ? (
          <span className="text-muted-foreground tabular-nums">
            <Trans
              i18nKey="inviteesCardResponded"
              defaults="{responded} of {total} responded"
              values={{ responded: respondedCount, total: invites.length }}
            />
          </span>
        ) : null}
      </div>
      {invites.length > 0 ? (
        <>
          <div
            aria-hidden
            className="mb-3 h-1.5 overflow-hidden rounded-sm bg-gray-400 dark:bg-gray-500"
          >
            <div
              className="h-full bg-green-500"
              style={{ width: `${(respondedCount / invites.length) * 100}%` }}
            />
          </div>
          {pending.length > 0 ? (
            <ul>
              {pending.slice(0, MAX_PENDING).map((invite) => (
                <li key={invite.id} className="flex h-9 items-center gap-2.5">
                  {invite.opened ? (
                    <MailOpenIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <MailIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {invite.email}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {invite.opened ? (
                      <Trans i18nKey="inviteStatusOpened" defaults="Opened" />
                    ) : (
                      <Trans i18nKey="inviteStatusSent" defaults="Sent" />
                    )}
                  </span>
                </li>
              ))}
              {pending.length > MAX_PENDING ? (
                <li className="flex h-9 items-center text-muted-foreground">
                  <Trans
                    i18nKey="inviteesCardMore"
                    defaults="+{count} more"
                    values={{ count: pending.length - MAX_PENDING }}
                  />
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="py-1 text-muted-foreground">
              <Trans
                i18nKey="inviteesCardAllResponded"
                defaults="Everyone you invited has responded."
              />
            </p>
          )}
        </>
      ) : (
        <p className="py-1 text-muted-foreground">
          <Trans
            i18nKey="inviteesCardEmpty"
            defaults="Nobody has been invited by email yet."
          />
        </p>
      )}
      {canInvite ? (
        <Button
          size="sm"
          shape="rounded"
          className="mt-3"
          onClick={() => share.open("manual")}
        >
          <UserPlusIcon data-icon="inline-start" />
          <Trans
            i18nKey="pollDescriptionCardInviteParticipants"
            defaults="Invite participants"
          />
        </Button>
      ) : null}
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
    </section>
  );
}
