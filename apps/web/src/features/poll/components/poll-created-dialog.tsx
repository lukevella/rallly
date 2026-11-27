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
import { useFeatureFlag } from "@/lib/feature-flags/client";

/**
 * Shown once a poll is created: the invite link to share, the page
 * participants see, and the way to the poll's page. Guests go through login
 * first, which saves the poll to their account. It can't be dismissed: the
 * only ways on are its links.
 */
export function PollCreatedDialog({
  pollId,
  isGuest,
}: {
  pollId: string;
  isGuest: boolean;
}) {
  const isPollAdminEnabled = useFeatureFlag("pollAdmin");
  const inviteLink = shortUrl(`/invite/${pollId}`);
  // The new poll page needs an account, so guests log in first. The legacy
  // page it replaces is open to guests.
  const needsLogin = isPollAdminEnabled && isGuest;
  const manageHref = !isPollAdminEnabled
    ? `/poll/${pollId}`
    : needsLogin
      ? `/login?redirectTo=${encodeURIComponent(`/polls/${pollId}`)}`
      : `/polls/${pollId}`;

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
        {needsLogin ? (
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="pollCreatedDialogGuestHint"
              defaults="Log in to see responses and manage this poll. It will be saved to your account."
            />
          </p>
        ) : null}
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
            href={manageHref}
            className={buttonVariants({ variant: "primary" })}
            onClick={() =>
              posthog?.capture("poll_creation:manage_link_click", {
                poll_id: pollId,
                is_guest: isGuest,
              })
            }
          >
            {needsLogin ? (
              <Trans
                i18nKey="pollCreatedDialogLogInToManage"
                defaults="Log in to manage"
              />
            ) : (
              <Trans
                i18nKey="pollCreatedDialogManagePoll"
                defaults="Manage poll"
              />
            )}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
