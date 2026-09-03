"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Separator } from "@rallly/ui/separator";
import { Share2Icon } from "lucide-react";
import { usePoll } from "@/features/poll/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
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
            <DialogDescription>
              <Trans
                i18nKey="shareDialogDescription"
                defaults="Share the invite link, or invite people by email."
              />
            </DialogDescription>
          </DialogHeader>
          <InviteLinkRow inviteLink={poll.inviteLink} />
          <Separator />
          <InviteByEmail />
        </DialogContent>
      </Dialog>
    </>
  );
}
