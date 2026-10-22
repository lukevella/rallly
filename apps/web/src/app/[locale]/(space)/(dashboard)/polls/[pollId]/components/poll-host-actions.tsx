"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import copy from "copy-to-clipboard";
import { CopyIcon, PencilIcon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * The host's everyday actions in the page header. The header centres the tabs
 * between the title and these, so the labels only show on 2xl screens, where
 * there is room for them; below that each button keeps its name through
 * aria-label.
 */
export function PollHostActions() {
  const poll = usePoll();
  const { t } = useTranslation();
  const share = useSharePollDialog(poll.id);
  const labelClassName = "sr-only 2xl:not-sr-only";

  return (
    <>
      {poll.status === "scheduled" ? null : (
        <Link
          href={`/poll/${poll.id}/edit?from=admin`}
          aria-label={t("edit", { defaultValue: "Edit" })}
          className={buttonVariants({ size: "sm" })}
        >
          <PencilIcon data-icon="inline-start" />
          <span className={labelClassName}>
            <Trans i18nKey="edit" defaults="Edit" />
          </span>
        </Link>
      )}
      <Button
        size="sm"
        aria-label={t("copyLink", { defaultValue: "Copy link" })}
        onClick={() => {
          // Only claims success when the copy actually went through
          if (!copy(poll.inviteLink)) return;
          posthog?.capture("poll_share:invite_link_copy", {
            poll_id: poll.id,
          });
          toast.success(t("linkCopied", { defaultValue: "Link copied" }));
        }}
      >
        <CopyIcon data-icon="inline-start" />
        <span className={labelClassName}>
          <Trans i18nKey="copyLink" defaults="Copy link" />
        </span>
      </Button>
      <Button
        size="sm"
        aria-label={t("pollDescriptionCardInviteParticipants", {
          defaultValue: "Invite participants",
        })}
        onClick={() => share.open("manual")}
      >
        <UserPlusIcon data-icon="inline-start" />
        <span className={labelClassName}>
          <Trans
            i18nKey="pollDescriptionCardInviteParticipants"
            defaults="Invite participants"
          />
        </span>
      </Button>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
    </>
  );
}
