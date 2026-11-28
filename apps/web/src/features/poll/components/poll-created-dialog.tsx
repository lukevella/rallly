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
 * Shown to a guest once their poll is created, since the poll's page needs
 * an account: the invite link to share, the page participants see, and a
 * way to log in to manage the poll. It can't be dismissed: the only ways on
 * are its links. Signed in hosts go straight to the poll's page instead.
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
              i18nKey="pollCreatedDialogGuestDescription"
              defaults="Share the invite link with the people you want to respond. Log in to manage this poll and see who responded."
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
            href={`/login?redirectTo=${encodeURIComponent(`/polls/${pollId}`)}`}
            className={buttonVariants({ variant: "primary" })}
            onClick={() =>
              posthog?.capture("poll_creation:login_to_manage_click", {
                poll_id: pollId,
              })
            }
          >
            <Trans i18nKey="logInToManage" defaults="Log in to manage" />
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
