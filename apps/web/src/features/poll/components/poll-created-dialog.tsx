"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { shortUrl } from "@rallly/utils/absolute-url";
import { ExternalLinkIcon } from "lucide-react";
import { Link } from "@/components/link";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
import { Trans } from "@/i18n/client";

/**
 * Shown once a poll is created: the invite link to share, the page
 * participants see, and the way to the poll's page. It can't be dismissed:
 * the only ways on are its links. Manage poll goes to the legacy page, which
 * hosts who opted into the new one are redirected from.
 */
export function PollCreatedDialog({ pollId }: { pollId: string }) {
  const inviteLink = shortUrl(`/invite/${pollId}`);

  return (
    <Dialog open disablePointerDismissal onOpenChange={() => {}}>
      <DialogContent
        size="lg"
        showCloseButton={false}
        data-testid="poll-created-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="pollCreatedDialogTitle" defaults="Poll created" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="pollCreatedDialogDescription"
              defaults="Share the invite link with the people you want to respond."
            />
          </DialogDescription>
        </DialogHeader>
        <InviteLinkRow pollId={pollId} inviteLink={inviteLink} />
        <DialogFooter>
          <a
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            <Trans
              i18nKey="pollCreatedDialogViewInvitePage"
              defaults="View invite page"
            />
            <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
          </a>
          <Link
            href={`/poll/${pollId}`}
            className={buttonVariants({ variant: "primary" })}
            onClick={() =>
              posthog?.capture("poll_creation:manage_link_click", {
                poll_id: pollId,
              })
            }
          >
            <Trans
              i18nKey="pollCreatedDialogManagePoll"
              defaults="Manage poll"
            />
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
