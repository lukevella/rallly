"use client";

import { posthog } from "@rallly/posthog/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Separator } from "@rallly/ui/separator";
import type React from "react";
import { useIsFree } from "@/features/billing/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
import type { PollStatus } from "@/features/poll/schema";
import { Trans } from "@/i18n/client";

type ShareSource = "poll_created" | "manual" | "empty_state";

/** Dialog state for SharePollDialog whose `open` records how it was opened. */
export function useSharePollDialog(pollId: string) {
  const dialog = useDialog();
  const isFree = useIsFree();

  const open = (source: ShareSource) => {
    posthog?.capture("poll_share:dialog_open", {
      poll_id: pollId,
      tier: isFree ? "free" : "pro",
      source,
    });
    dialog.trigger();
  };

  return { dialog, open };
}

export function SharePollDialog({
  pollId,
  pollStatus,
  inviteLink,
  ...dialogProps
}: React.ComponentProps<typeof Dialog> & {
  pollId: string;
  pollStatus: PollStatus;
  inviteLink: string;
}) {
  return (
    <Dialog {...dialogProps}>
      <DialogContent size="lg" data-testid="invite-participant-dialog">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="share" defaults="Share" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="shareDialogDescription"
              defaults="Share the invite link, or invite people by email."
            />
          </DialogDescription>
        </DialogHeader>
        <InviteLinkRow pollId={pollId} inviteLink={inviteLink} />
        <Separator />
        <InviteByEmail pollId={pollId} pollStatus={pollStatus} />
      </DialogContent>
    </Dialog>
  );
}
