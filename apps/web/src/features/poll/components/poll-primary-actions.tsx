"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { CalendarCheck2Icon } from "lucide-react";
import { usePoll } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import { ShareDialog } from "@/features/poll/components/share-dialog";
import { Trans } from "@/i18n/client";

/**
 * The header's two actions. Finalize is the call to action for as long as
 * there is something to finalize; a new poll opens the share dialog on its
 * own, so Share stays secondary here.
 */
export function PollPrimaryActions() {
  const poll = usePoll();
  const finalizeDialog = useDialog();
  const canFinalize = poll.status === "open" || poll.status === "closed";

  return (
    <>
      <ShareDialog
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
        variant={canFinalize ? "default" : "primary"}
      />
      {canFinalize ? (
        <Button variant="primary" {...finalizeDialog.triggerProps}>
          <CalendarCheck2Icon data-icon="inline-start" />
          <span className="sr-only sm:not-sr-only">
            <Trans i18nKey="finalize" defaults="Finalize" />
          </span>
        </Button>
      ) : null}
      <FinalizePollDialog {...finalizeDialog.dialogProps} />
    </>
  );
}
