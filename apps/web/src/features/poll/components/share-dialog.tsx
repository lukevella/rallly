"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Separator } from "@rallly/ui/separator";
import { Share2Icon } from "lucide-react";
import { usePoll } from "@/features/poll/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteLinkField } from "@/features/poll/components/invite-link-field";
import { Trans } from "@/i18n/client";

export function ShareDialog() {
  const poll = usePoll();
  const dialog = useDialog();

  return (
    <>
      <Button variant="primary" {...dialog.triggerProps}>
        <Share2Icon data-icon="inline-start" />
        <span className="sr-only sm:not-sr-only">
          <Trans i18nKey="share" defaults="Share" />
        </span>
      </Button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="lg" data-testid="invite-participant-dialog">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="share" defaults="Share" />
            </DialogTitle>
          </DialogHeader>
          <section
            aria-labelledby="share-dialog-link-heading"
            className="space-y-2"
          >
            <h3
              id="share-dialog-link-heading"
              className="font-semibold text-sm"
            >
              <Trans
                i18nKey="shareDialogInviteByLink"
                defaults="Invite by link"
              />
            </h3>
            <InviteLinkField inviteLink={poll.inviteLink} />
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="inviteParticipantLinkInfo"
                defaults="Anyone with this link will be able to vote on your poll."
              />
            </p>
          </section>
          <Separator />
          <InviteByEmail />
        </DialogContent>
      </Dialog>
    </>
  );
}
