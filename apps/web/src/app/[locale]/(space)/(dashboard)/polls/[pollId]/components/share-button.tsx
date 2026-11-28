"use client";

import { Button } from "@rallly/ui/button";
import { MailIcon } from "lucide-react";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import type { PollStatus } from "@/features/poll/schema";
import { Trans } from "@/i18n/client";

export function ShareButton({
  pollId,
  pollStatus,
}: {
  pollId: string;
  pollStatus: PollStatus;
}) {
  const share = useSharePollDialog(pollId);
  return (
    <>
      <Button size="sm" onClick={() => share.open("manual")}>
        <MailIcon data-icon="inline-start" aria-hidden="true" />
        <Trans i18nKey="pollStatsInviteByEmail" defaults="Invite by email" />
      </Button>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={pollId}
        pollStatus={pollStatus}
      />
    </>
  );
}
