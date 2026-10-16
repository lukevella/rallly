"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { CalendarCheck2Icon, Share2Icon } from "lucide-react";
import * as React from "react";
import { usePoll } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { SHARE_POLL_FLASH_KEY } from "@/features/poll/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";

type ActionBarProps = {
  canFinalize: boolean;
  onShare: () => void;
  onFinalize: () => void;
};

/**
 * Finalize is the call to action for as long as there is something to
 * finalize; a new poll opens the share dialog on its own, so Share stays
 * secondary here.
 */
function DesktopActionBar({
  canFinalize,
  onShare,
  onFinalize,
}: ActionBarProps) {
  return (
    <>
      <Button variant={canFinalize ? "default" : "primary"} onClick={onShare}>
        <Share2Icon data-icon="inline-start" />
        <Trans i18nKey="share" defaults="Share" />
      </Button>
      {canFinalize ? (
        <Button variant="primary" onClick={onFinalize}>
          <CalendarCheck2Icon data-icon="inline-start" />
          <Trans i18nKey="finalize" defaults="Finalize" />
        </Button>
      ) : null}
    </>
  );
}

function MobileActionBar({ canFinalize, onShare, onFinalize }: ActionBarProps) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant={canFinalize ? "default" : "primary"}
        size="icon"
        aria-label={t("share", { defaultValue: "Share" })}
        onClick={onShare}
      >
        <Share2Icon />
      </Button>
      {canFinalize ? (
        <Button
          variant="primary"
          size="icon"
          aria-label={t("finalize", { defaultValue: "Finalize" })}
          onClick={onFinalize}
        >
          <CalendarCheck2Icon />
        </Button>
      ) : null}
    </>
  );
}

/**
 * The header's share and finalize actions. Both bars render and CSS picks
 * one, so the server markup is right for either screen size; the dialogs
 * live outside the bars so each mounts once.
 */
export function PollPrimaryActions() {
  const poll = usePoll();
  const share = useSharePollDialog(poll.id);
  const finalizeDialog = useDialog();
  const sharePollFlash = useFlash(SHARE_POLL_FLASH_KEY);
  const canFinalize = poll.status === "open" || poll.status === "closed";

  // The create page flashes the new poll's id so the share dialog is the
  // confirmation. The flash is consumed on read, so refresh and back don't
  // reopen it. Keyed on the flash alone so a later poll id change can't
  // replay it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per flash arrival
  React.useEffect(() => {
    if (sharePollFlash !== poll.id) return;
    share.open("poll_created");
  }, [sharePollFlash]);

  const actionBarProps: ActionBarProps = {
    canFinalize,
    onShare: () => share.open("manual"),
    onFinalize: () => {
      posthog?.capture("poll_finalize:dialog_open");
      finalizeDialog.trigger();
    },
  };

  return (
    <>
      <div className="contents sm:hidden">
        <MobileActionBar {...actionBarProps} />
      </div>
      <div className="hidden sm:contents">
        <DesktopActionBar {...actionBarProps} />
      </div>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
      <FinalizePollDialog {...finalizeDialog.dialogProps} />
    </>
  );
}
