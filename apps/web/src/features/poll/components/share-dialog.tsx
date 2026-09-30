"use client";

import { posthog } from "@rallly/posthog/client";
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
import React from "react";
import { useIsFree } from "@/features/billing/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
import { SHARE_POLL_FLASH_KEY } from "@/features/poll/constants";
import type { PollStatus } from "@/features/poll/schema";
import { Trans } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";

export function ShareDialog({
  pollId,
  pollStatus,
  inviteLink,
}: {
  pollId: string;
  pollStatus: PollStatus;
  inviteLink: string;
}) {
  const dialog = useDialog();
  const isFree = useIsFree();
  const isOpen = dialog.dialogProps.open;
  const sharePollFlash = useFlash(SHARE_POLL_FLASH_KEY);
  const openSource = React.useRef<"poll_created" | "manual">("manual");

  // The create page flashes the new poll's id so this dialog is the
  // confirmation. The flash is consumed on read, so refresh and back don't
  // reopen it. Keyed on the flash alone so a later poll id change can't
  // replay it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per flash arrival
  React.useEffect(() => {
    if (sharePollFlash !== pollId) return;
    openSource.current = "poll_created";
    dialog.trigger();
  }, [sharePollFlash]);

  React.useEffect(() => {
    if (!isOpen) return;
    posthog?.capture("poll_share:dialog_open", {
      poll_id: pollId,
      tier: isFree ? "free" : "pro",
      source: openSource.current,
    });
    openSource.current = "manual";
  }, [isOpen, pollId, isFree]);

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
          <InviteLinkRow pollId={pollId} inviteLink={inviteLink} />
          <Separator />
          <InviteByEmail pollId={pollId} pollStatus={pollStatus} />
        </DialogContent>
      </Dialog>
    </>
  );
}
