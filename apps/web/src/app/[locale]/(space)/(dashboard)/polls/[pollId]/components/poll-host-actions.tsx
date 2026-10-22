"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import copy from "copy-to-clipboard";
import { CopyIcon, PencilIcon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { useTranslation } from "@/i18n/client";

export function useCopyInviteLink() {
  const poll = usePoll();
  const { t } = useTranslation();
  return () => {
    // Only claims success when the copy actually went through
    if (!copy(poll.inviteLink)) return;
    posthog?.capture("poll_share:invite_link_copy", { poll_id: poll.id });
    toast.success(t("linkCopied", { defaultValue: "Link copied" }));
  };
}

/**
 * The host's everyday actions in the page header, as icon buttons. Each is
 * named for assistive tech by aria-label and for everyone else by a tooltip.
 */
export function PollHostActions() {
  const poll = usePoll();
  const { t } = useTranslation();
  const share = useSharePollDialog(poll.id);
  const copyInviteLink = useCopyInviteLink();
  const editLabel = t("edit", { defaultValue: "Edit" });
  const copyLabel = t("copyLink", { defaultValue: "Copy link" });
  const inviteLabel = t("pollDescriptionCardInviteParticipants", {
    defaultValue: "Invite participants",
  });

  return (
    <>
      {poll.status === "scheduled" ? null : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href={`/poll/${poll.id}/edit?from=admin`}
                aria-label={editLabel}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              />
            }
          >
            <PencilIcon />
          </TooltipTrigger>
          <TooltipContent>{editLabel}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={copyLabel}
              onClick={copyInviteLink}
            />
          }
        >
          <CopyIcon />
        </TooltipTrigger>
        <TooltipContent>{copyLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={inviteLabel}
              onClick={() => share.open("manual")}
            />
          }
        >
          <UserPlusIcon />
        </TooltipTrigger>
        <TooltipContent>{inviteLabel}</TooltipContent>
      </Tooltip>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
    </>
  );
}
