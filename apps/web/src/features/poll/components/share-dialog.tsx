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
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { useIsFree } from "@/features/billing/client";
import { usePoll } from "@/features/poll/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
import type { PollInviteListItem } from "@/features/poll/invite/types";
import { Trans } from "@/i18n/client";

export function ShareDialog({ invites }: { invites: PollInviteListItem[] }) {
  const poll = usePoll();
  const dialog = useDialog();
  const isFree = useIsFree();
  const isOpen = dialog.dialogProps.open;
  const pathname = usePathname();
  const hasShareParam = useSearchParams().has("share");
  const openSource = React.useRef<"poll_created" | "manual">("manual");

  // The create page redirects here with ?share so the dialog is the
  // confirmation. Drop the param once consumed so refresh and back don't
  // reopen it; replaceState keeps the layout mounted and the dialog open.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per param arrival
  React.useEffect(() => {
    if (!hasShareParam) return;
    openSource.current = "poll_created";
    dialog.trigger();
    window.history.replaceState(null, "", pathname);
  }, [hasShareParam]);

  React.useEffect(() => {
    if (!isOpen) return;
    posthog?.capture("poll_share:dialog_open", {
      poll_id: poll.id,
      tier: isFree ? "free" : "pro",
      source: openSource.current,
    });
    openSource.current = "manual";
  }, [isOpen, poll.id, isFree]);

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
          <InviteByEmail invites={invites} />
        </DialogContent>
      </Dialog>
    </>
  );
}
